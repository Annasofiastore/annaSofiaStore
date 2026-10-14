import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { sendOrderConfirmationEmail, sendNewOrderAdminEmail } from "@/lib/email/templates";
import { sendEmailsSafe } from "@/lib/email/resend";

const WOMPI_BASE =
  process.env.NEXT_PUBLIC_WOMPI_ENV === "production"
    ? "https://production.wompi.co/v1"
    : "https://sandbox.wompi.co/v1";

// Confirma el pago en BD y envía emails — misma lógica que el webhook
async function processApprovedPayment(
  supabase: ReturnType<typeof createServiceClient>,
  order: any,
  transactionId: string
) {
  // Idempotencia: si ya está pagado, no hacer nada
  if (order.status === "paid") return;

  // 1. Confirmar stock
  for (const item of order.items ?? []) {
    await supabase.rpc("confirm_stock_sale", {
      p_variant_id: item.variant_id,
      p_session_id: order.cart_session_id ?? order.wompi_reference,
      p_quantity: item.quantity,
      p_order_id: order.id,
    });
  }

  // 2. Actualizar pedido — sin guard de status para recuperar pedidos cancelados por timeout
  await supabase
    .from("orders")
    .update({
      status: "paid",
      wompi_transaction_id: transactionId,
      paid_at: new Date().toISOString(),
    })
    .eq("id", order.id)
    .in("status", ["pending_payment", "cancelled"]); // recupera tanto pendientes como cancelados por timeout

  // 3. Log
  await supabase.from("order_status_log").insert({
    order_id: order.id,
    from_status: "pending_payment",
    to_status: "paid",
    notes: `Pago confirmado via verificación directa Wompi. Transacción: ${transactionId}`,
  });

  // 4. Emails — refetch para tener datos completos
  const { data: fullOrder } = await supabase
    .from("orders")
    .select("*, items:order_items(*)")
    .eq("id", order.id)
    .single();

  if (fullOrder) {
    await sendEmailsSafe(
      `status/${order.order_number}`,
      sendOrderConfirmationEmail(fullOrder),
      sendNewOrderAdminEmail(fullOrder),
    );
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params;

  const supabase = createServiceClient();
  const { data: order } = await supabase
    .from("orders")
    .select("*, items:order_items(*), wompi_reference, cart_session_id")
    .eq("id", orderId)
    .single();

  if (!order) {
    return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
  }

  // Si ya no está pendiente, devolver estado actual directamente
  if (order.status !== "pending_payment" || !order.wompi_reference) {
    return NextResponse.json({ status: order.status, paid_at: order.paid_at });
  }

  // El pedido sigue en pending_payment — consultar la API de Wompi para verificar
  const privateKey = process.env.WOMPI_PRIVATE_KEY;
  if (!privateKey) {
    console.error("[orders/status] WOMPI_PRIVATE_KEY no configurado");
    return NextResponse.json({ status: order.status });
  }

  try {
    const wompiRes = await fetch(
      `${WOMPI_BASE}/transactions?reference=${encodeURIComponent(order.wompi_reference)}`,
      {
        headers: { Authorization: `Bearer ${privateKey}` },
        cache: "no-store",
      }
    );

    if (!wompiRes.ok) {
      console.error("[orders/status] Wompi API error:", wompiRes.status);
      return NextResponse.json({ status: order.status });
    }

    const { data: transactions } = await wompiRes.json();
    const approvedTx = (transactions ?? []).find(
      (tx: any) => tx.status === "APPROVED"
    );

    if (approvedTx) {
      await processApprovedPayment(supabase, order, approvedTx.id);
      return NextResponse.json({ status: "paid", paid_at: new Date().toISOString() });
    }

    // Si Wompi devuelve DECLINED/VOIDED, reportar
    const failedTx = (transactions ?? []).find(
      (tx: any) => tx.status === "DECLINED" || tx.status === "VOIDED" || tx.status === "ERROR"
    );
    if (failedTx) {
      return NextResponse.json({ status: "payment_failed" });
    }
  } catch (err) {
    console.error("[orders/status] Error al consultar Wompi:", err);
  }

  return NextResponse.json({ status: order.status });
}
