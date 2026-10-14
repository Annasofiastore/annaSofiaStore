import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { createServiceClient } from "@/lib/supabase/server";

const RETRY_WINDOW_MS = 25 * 60 * 1000; // 25 minutos — margen antes de la cancelación a los 30

function buildSignature(
  reference: string,
  amountInCents: number,
  currency: string,
  secret: string
): string {
  return createHash("sha256")
    .update(`${reference}${amountInCents}${currency}${secret}`)
    .digest("hex");
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params;
  const supabase = createServiceClient();

  const { data: order } = await supabase
    .from("orders")
    .select("*, items:order_items(*)")
    .eq("id", orderId)
    .single();

  if (!order) {
    return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
  }

  if (order.status === "cancelled") {
    return NextResponse.json({ error: "Este pedido fue cancelado. Por favor realiza un nuevo pedido." }, { status: 400 });
  }

  if (order.status !== "pending_payment") {
    return NextResponse.json({ error: "Este pedido ya fue procesado" }, { status: 400 });
  }

  const age = Date.now() - new Date(order.created_at).getTime();
  if (age > RETRY_WINDOW_MS) {
    return NextResponse.json({
      error: "El tiempo para completar el pago expiró. Por favor realiza un nuevo pedido.",
    }, { status: 400 });
  }

  const sessionId = order.cart_session_id ?? order.wompi_reference;

  // Liberar reservas anteriores (pueden estar expiradas o activas)
  for (const item of order.items) {
    await supabase.rpc("release_reservations_by_session", {
      p_variant_id: item.variant_id,
      p_session_id: sessionId,
    });
  }

  // Re-reservar stock por 10 minutos más
  const failedItems: string[] = [];
  for (const item of order.items) {
    const { data: ok } = await supabase.rpc("reserve_stock", {
      p_variant_id: item.variant_id,
      p_session_id: sessionId,
      p_quantity: item.quantity,
      p_minutes: 10,
    });
    if (!ok) failedItems.push(item.product_name);
  }

  if (failedItems.length) {
    return NextResponse.json({
      error: `Algunos productos ya no tienen stock disponible: ${failedItems.join(", ")}`,
    }, { status: 409 });
  }

  // Nueva referencia para evitar conflictos con la transacción anterior en Wompi
  const newReference = `${order.wompi_reference}-R${Date.now().toString(36).toUpperCase()}`;
  const amountInCents = Math.round(order.total * 100);
  const currency = "COP";
  const integritySignature = buildSignature(
    newReference,
    amountInCents,
    currency,
    process.env.WOMPI_INTEGRITY_SECRET!
  );

  await supabase
    .from("orders")
    .update({ wompi_reference: newReference })
    .eq("id", orderId);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!;
  return NextResponse.json({
    wompi: {
      publicKey: process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY!,
      currency,
      amountInCents,
      reference: newReference,
      redirectUrl: `${siteUrl}/confirmacion/${orderId}`,
      integritySignature,
    },
  });
}
