import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { WOMPI_BASE, reconcileWompiOrder } from "@/lib/payments/wompi-reconcile";

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

  // Un pedido cancelado por timeout puede haberse pagado después: se verifica igual con Wompi.
  if (order.status === "cancelled" && order.payment_method === "wompi" && order.wompi_reference) {
    const recovered = await reconcileWompiOrder(supabase, order);
    if (recovered) return NextResponse.json({ status: "paid", paid_at: new Date().toISOString() });
    return NextResponse.json({ status: order.status, paid_at: order.paid_at });
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
      await reconcileWompiOrder(supabase, order);
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
