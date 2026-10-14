import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { sendOrderConfirmationEmail, sendNewOrderAdminEmail } from "@/lib/email/templates";
import { sendEmailsSafe } from "@/lib/email/resend";

const WOMPI_BASE =
  process.env.NEXT_PUBLIC_WOMPI_ENV === "production"
    ? "https://production.wompi.co/v1"
    : "https://sandbox.wompi.co/v1";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const auth = await createClient();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const supabase = createServiceClient();

  const { data: order } = await supabase
    .from("orders")
    .select("*, items:order_items(*)")
    .eq("id", id)
    .single();

  if (!order) return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });

  if (order.payment_method !== "wompi") {
    return NextResponse.json({ error: "Este pedido no es de pago online" }, { status: 400 });
  }

  if (!order.wompi_reference) {
    return NextResponse.json({ error: "El pedido no tiene referencia de Wompi" }, { status: 400 });
  }

  if (order.status === "paid") {
    return NextResponse.json({ ok: true, message: "El pedido ya estaba pagado", status: "paid" });
  }

  const privateKey = process.env.WOMPI_PRIVATE_KEY;
  if (!privateKey) {
    return NextResponse.json(
      { error: "WOMPI_PRIVATE_KEY no configurado en Vercel — contactar al desarrollador" },
      { status: 500 }
    );
  }

  // Consultar Wompi directamente por la referencia del pedido
  const wompiRes = await fetch(
    `${WOMPI_BASE}/transactions?reference=${encodeURIComponent(order.wompi_reference)}`,
    {
      headers: { Authorization: `Bearer ${privateKey}` },
      cache: "no-store",
    }
  );

  if (!wompiRes.ok) {
    const errText = await wompiRes.text().catch(() => wompiRes.status.toString());
    console.error("[verify-payment] Wompi API error:", wompiRes.status, errText);
    return NextResponse.json(
      { error: `Error al consultar Wompi: ${wompiRes.status}` },
      { status: 502 }
    );
  }

  const { data: transactions } = await wompiRes.json();
  const approvedTx = (transactions ?? []).find((tx: any) => tx.status === "APPROVED");

  if (!approvedTx) {
    const statuses = (transactions ?? []).map((tx: any) => tx.status).join(", ") || "sin transacciones";
    return NextResponse.json({
      ok: false,
      message: `Wompi no reporta un pago aprobado para esta referencia. Estados encontrados: ${statuses}`,
      wompi_reference: order.wompi_reference,
    });
  }

  // Pago aprobado en Wompi — confirmar en la BD
  // 1. Confirmar stock de cada variante
  for (const item of order.items ?? []) {
    const { error: stockErr } = await supabase.rpc("confirm_stock_sale", {
      p_variant_id: item.variant_id,
      p_session_id: order.cart_session_id ?? order.wompi_reference,
      p_quantity: item.quantity,
      p_order_id: order.id,
    });
    if (stockErr) {
      console.error("[verify-payment] confirm_stock_sale error:", stockErr);
    }
  }

  // 2. Actualizar pedido a "paid" — sin guard de status para poder recuperar cancelados
  await supabase
    .from("orders")
    .update({
      status: "paid",
      wompi_transaction_id: approvedTx.id,
      paid_at: new Date().toISOString(),
    })
    .eq("id", order.id);

  // 3. Log auditable
  await supabase.from("order_status_log").insert({
    order_id: order.id,
    from_status: order.status,
    to_status: "paid",
    changed_by: user.id,
    notes: `Pago verificado manualmente desde admin. Transacción Wompi: ${approvedTx.id}`,
  });

  // 4. Emails (best-effort)
  const { data: fullOrder } = await supabase
    .from("orders")
    .select("*, items:order_items(*)")
    .eq("id", order.id)
    .single();

  if (fullOrder) {
    await sendEmailsSafe(
      `verify-payment/${order.order_number}`,
      sendOrderConfirmationEmail(fullOrder),
      sendNewOrderAdminEmail(fullOrder),
    );
  }

  return NextResponse.json({
    ok: true,
    message: "Pago verificado y pedido actualizado a Pagado",
    wompi_transaction_id: approvedTx.id,
    status: "paid",
  });
}
