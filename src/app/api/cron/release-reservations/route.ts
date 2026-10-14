import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { sendOrderConfirmationEmail, sendNewOrderAdminEmail } from "@/lib/email/templates";
import { sendEmailsSafe } from "@/lib/email/resend";

const WOMPI_BASE =
  process.env.NEXT_PUBLIC_WOMPI_ENV === "production"
    ? "https://production.wompi.co/v1"
    : "https://sandbox.wompi.co/v1";

// Llamado por Vercel Cron diariamente a las 3 AM — RB-CHK-01, RB-PED-02
// También ejecuta reconciliación con Wompi para pedidos con webhook fallido
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const results: Record<string, unknown> = {};

  // 1. Liberar reservas de stock expiradas (10 min) — RB-CHK-01
  const { error: releaseError } = await supabase.rpc("release_expired_reservations");
  if (releaseError) console.error("release_expired_reservations error:", releaseError);
  results.reservations_released = !releaseError;

  // 2. Cancelar pedidos en pending_payment con más de 30 min sin pago — RB-PED-02
  const { data: cancelledCount, error: cancelError } = await supabase.rpc("cancel_expired_orders");
  if (cancelError) console.error("cancel_expired_orders error:", cancelError);
  results.orders_cancelled = cancelledCount ?? 0;

  // 3. Reconciliación con Wompi: buscar pedidos cancelled o pending_payment
  //    con wompi_reference y verificar si en realidad fueron aprobados
  const privateKey = process.env.WOMPI_PRIVATE_KEY;
  if (privateKey) {
    const { data: pendingOrders } = await supabase
      .from("orders")
      .select("*, items:order_items(*)")
      .in("status", ["cancelled", "pending_payment"])
      .eq("payment_method", "wompi")
      .not("wompi_reference", "is", null)
      .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()); // últimos 7 días

    let reconciled = 0;

    for (const order of pendingOrders ?? []) {
      try {
        const wompiRes = await fetch(
          `${WOMPI_BASE}/transactions?reference=${encodeURIComponent(order.wompi_reference)}`,
          { headers: { Authorization: `Bearer ${privateKey}` }, cache: "no-store" }
        );
        if (!wompiRes.ok) continue;

        const { data: txs } = await wompiRes.json();
        const approvedTx = (txs ?? []).find((tx: any) => tx.status === "APPROVED");
        if (!approvedTx) continue;

        // Pago aprobado en Wompi pero no registrado en BD — corregir
        for (const item of order.items ?? []) {
          await supabase.rpc("confirm_stock_sale", {
            p_variant_id: item.variant_id,
            p_session_id: order.cart_session_id ?? order.wompi_reference,
            p_quantity: item.quantity,
            p_order_id: order.id,
          });
        }

        await supabase
          .from("orders")
          .update({
            status: "paid",
            wompi_transaction_id: approvedTx.id,
            paid_at: new Date().toISOString(),
          })
          .eq("id", order.id);

        await supabase.from("order_status_log").insert({
          order_id: order.id,
          from_status: order.status,
          to_status: "paid",
          notes: `Pago reconciliado por cron. Transacción Wompi: ${approvedTx.id}`,
        });

        const { data: fullOrder } = await supabase
          .from("orders")
          .select("*, items:order_items(*)")
          .eq("id", order.id)
          .single();

        if (fullOrder) {
          await sendEmailsSafe(
            `cron/reconcile/${order.order_number}`,
            sendOrderConfirmationEmail(fullOrder),
            sendNewOrderAdminEmail(fullOrder),
          );
        }

        console.log("[cron/reconcile] Pedido reconciliado:", order.order_number, "tx:", approvedTx.id);
        reconciled++;
      } catch (err) {
        console.error("[cron/reconcile] Error reconciliando pedido:", order.order_number, err);
      }
    }

    results.orders_reconciled = reconciled;
  } else {
    results.reconciliation = "omitida — WOMPI_PRIVATE_KEY no configurado";
  }

  return NextResponse.json({
    ok: !releaseError && !cancelError,
    ...results,
    timestamp: new Date().toISOString(),
  });
}
