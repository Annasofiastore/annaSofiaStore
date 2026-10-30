import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { createServiceClient } from "@/lib/supabase/server";
import { sendOrderConfirmationEmail, sendNewOrderAdminEmail } from "@/lib/email/templates";
import { sendEmailsSafe } from "@/lib/email/resend";
import { validateCustomerFields, normalizePhone } from "@/lib/validation/checkout";
import { priceCart } from "@/lib/checkout/pricing";
import { getShippingZone } from "@/lib/checkout/shipping";
import { validatePromotion } from "@/lib/checkout/promotions";
import { isContraentregaCity } from "@/lib/checkout/config";
import type { CheckoutForm } from "@/types";

// El navegador solo manda QUÉ compra (variante y cantidad), el cupón y el total que le mostró a la clienta.
// Precios, descuento, envío y total se recalculan aquí; el total del navegador solo sirve para detectar
// que algo cambió entre lo que ella vio y lo que realmente se cobraría.
interface CheckoutPayload {
  form: CheckoutForm;
  items: { variantId: string; quantity: number }[];
  sessionId: string;
  total: number;
  couponCode?: string | null;
  paymentMethod?: "wompi" | "contraentrega";
}

function buildWompiSignature(
  reference: string,
  amountInCents: number,
  currency: string,
  secret: string
): string {
  const str = `${reference}${amountInCents}${currency}${secret}`;
  return createHash("sha256").update(str).digest("hex");
}

export async function POST(req: NextRequest) {
  try {
    const payload: CheckoutPayload = await req.json();
    const { form, items: requestedItems, sessionId, total: clientTotal, couponCode } = payload;
    const paymentMethod = payload.paymentMethod === "contraentrega" ? "contraentrega" : "wompi";

    // El navegador ya valida, pero el servidor no puede fiarse de lo que le lleguen
    const fieldError = validateCustomerFields(form);
    if (fieldError) {
      return NextResponse.json({ error: fieldError }, { status: 400 });
    }
    form.full_name = form.full_name.trim().replace(/\s+/g, " ");
    form.phone = normalizePhone(form.phone);

    const supabase = createServiceClient();

    // Contraentrega solo en las ciudades habilitadas
    if (paymentMethod === "contraentrega" && !isContraentregaCity(form.city)) {
      return NextResponse.json(
        { error: "El pago contra entrega no está disponible en tu ciudad." },
        { status: 400 }
      );
    }

    // Precios reales desde la base, con stock asegurado — lo que mande el navegador se ignora
    const priced = await priceCart(supabase, requestedItems, sessionId);
    if (!priced.ok) {
      return NextResponse.json({ error: priced.error }, { status: priced.status });
    }
    const { items, subtotal } = priced;

    // Envío según la zona de la ciudad en la base
    const zone = await getShippingZone(supabase, form.city);
    if (!zone) {
      return NextResponse.json(
        { error: "No se pudo calcular el envío. Contáctanos para completar tu pedido." },
        { status: 500 }
      );
    }
    const shippingCost = zone.price;

    // Cupón validado en el servidor (el uso se registra cuando el pago queda confirmado)
    let discountAmount = 0;
    let promotionId: string | null = null;
    if (couponCode) {
      const check = await validatePromotion(supabase, couponCode, subtotal, form.email);
      if (!check.valid) {
        return NextResponse.json({ error: check.message, code: "COUPON_INVALID" }, { status: 409 });
      }
      discountAmount = check.discountAmount;
      promotionId = check.promotion.id;
    }

    const total = Math.max(0, subtotal - discountAmount + shippingCost);

    // Si el total no coincide con lo que vio la clienta, no se cobra: pudo cambiar un precio o el envío
    if (typeof clientTotal !== "number" || Math.abs(clientTotal - total) > 1) {
      return NextResponse.json(
        {
          error: "Los precios de tu pedido cambiaron. Revisa el resumen y vuelve a intentarlo.",
          code: "PRICE_CHANGED",
          total,
        },
        { status: 409 }
      );
    }

    // 1. Obtener o crear cliente — RB-CHK-07
    let customerId: string | null = null;
    const { data: existingCustomer } = await supabase
      .from("customers")
      .select("id")
      .eq("email", form.email.toLowerCase())
      .single();

    if (existingCustomer) {
      customerId = existingCustomer.id;
    } else {
      const { data: newCustomer } = await supabase
        .from("customers")
        .insert({
          email: form.email.toLowerCase(),
          full_name: form.full_name,
          phone: form.phone,
          id_type: form.id_type || null,
          id_number: form.id_number || null,
          marketing_email: form.save_address ?? false,
          is_guest: true,
        })
        .select("id")
        .single();
      customerId = newCustomer?.id ?? null;
    }

    // 2. Crear pedido con número consecutivo desde la secuencia de la DB
    const { data: seqData } = await supabase.rpc("next_order_number");
    const orderNumber = (seqData as string) ?? `AS-${Date.now().toString(36).toUpperCase()}`;
    const wompiReference = orderNumber; // único por pedido; el reintento le agrega un sufijo
    const isContraentrega = paymentMethod === "contraentrega";
    const now = new Date().toISOString();

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        order_number: orderNumber,
        customer_id: customerId,
        // Contraentrega no nace pagada: el pago se cobra al entregar (ver admin/orders/[id]/status)
        status: "pending_payment",
        payment_method: paymentMethod,
        shipping_name: form.full_name,
        shipping_email: form.email.toLowerCase(),
        shipping_phone: form.phone,
        customer_id_type: form.id_type || null,
        customer_id_number: form.id_number || null,
        shipping_address: form.address,
        shipping_city: form.city,
        shipping_department: form.department,
        subtotal,
        discount_amount: discountAmount,
        promotion_id: promotionId, // el trigger registra el uso cuando el pedido queda pagado
        shipping_cost: shippingCost,
        total,
        wompi_reference: isContraentrega ? null : wompiReference,
        paid_at: null,
        cart_session_id: sessionId,
        terms_accepted: form.terms_accepted,
        terms_accepted_at: now,
      })
      .select("id, order_number")
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: "Error al crear el pedido" }, { status: 500 });
    }

    // 3. Insertar items del pedido
    const orderItems = items.map((item) => ({
      order_id: order.id,
      variant_id: item.variantId,
      product_id: item.productId,
      product_name: item.productName,
      variant_sku: item.sku,
      variant_attrs: item.attributes,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      total_price: item.unitPrice * item.quantity,
    }));

    await supabase.from("order_items").insert(orderItems);

    if (isContraentrega) {
      // ── FLUJO CONTRAENTREGA — confirmar stock y enviar emails de inmediato
      for (const item of items) {
        await supabase.rpc("confirm_stock_sale", {
          p_variant_id: item.variantId,
          p_session_id: sessionId,
          p_quantity: item.quantity,
          p_order_id: order.id,
        });
      }

      await supabase.from("order_status_log").insert({
        order_id: order.id,
        from_status: null,
        to_status: "pending_payment",
        notes: "Pedido contraentrega recibido — el pago se cobra al entregar",
      });

      // Obtener pedido completo con items para emails
      const { data: fullOrder } = await supabase
        .from("orders")
        .select("*, items:order_items(*)")
        .eq("id", order.id)
        .single();

      if (fullOrder) {
        await sendEmailsSafe(
          `checkout/contraentrega/${order.order_number}`,
          sendOrderConfirmationEmail(fullOrder),
          sendNewOrderAdminEmail(fullOrder),
        );
      }

      return NextResponse.json({
        orderId: order.id,
        orderNumber: order.order_number,
        contraentrega: true,
      });
    }

    // 4. Log de estado inicial (Wompi)
    await supabase.from("order_status_log").insert({
      order_id: order.id,
      from_status: null,
      to_status: "pending_payment",
      notes: "Pedido creado — esperando confirmación de Wompi",
    });

    // 5. Construir datos de Wompi
    const amountInCents = Math.round(total * 100);
    const currency = "COP";
    const integritySecret = process.env.WOMPI_INTEGRITY_SECRET!;
    const integritySignature = buildWompiSignature(
      wompiReference,
      amountInCents,
      currency,
      integritySecret
    );

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!;
    const redirectUrl = `${siteUrl}/confirmacion/${order.id}`;

    return NextResponse.json({
      orderId: order.id,
      orderNumber: order.order_number,
      wompi: {
        publicKey: process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY!,
        currency,
        amountInCents,
        reference: wompiReference,
        redirectUrl,
        integritySignature,
      },
    });
  } catch (err) {
    console.error("[checkout]", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
