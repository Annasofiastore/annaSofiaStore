import { createServiceClient } from "@/lib/supabase/server";
import { sendOrderConfirmationEmail, sendNewOrderAdminEmail } from "@/lib/email/templates";
import { sendEmailsSafe } from "@/lib/email/resend";

export const WOMPI_BASE =
  process.env.NEXT_PUBLIC_WOMPI_ENV === "production"
    ? "https://production.wompi.co/v1"
    : "https://sandbox.wompi.co/v1";

type Db = ReturnType<typeof createServiceClient>;

// Estados desde los que un pedido de Wompi todavía puede pasar a "paid".
// "cancelled" se incluye porque la limpieza automática puede cancelar un pedido
// cuyo pago se aprueba después (o cuyo aviso nunca llegó).
const RECOVERABLE = ["pending_payment", "cancelled"];

/**
 * Un pedido se puede recuperar si está pendiente, o si fue cancelado SIN haberse pagado nunca (la limpieza
 * automática de las 4 horas). Un pedido cancelado que ya tenía `paid_at` lo canceló una persona a propósito
 * (por ejemplo para devolver el dinero): Wompi lo sigue mostrando aprobado, y no debe volver a "Pagado".
 */
export function isRecoverable(order: { status: string; paid_at?: string | null }): boolean {
  return order.status === "pending_payment" || (order.status === "cancelled" && !order.paid_at);
}

/** Id de la transacción APPROVED de Wompi para esa referencia, o null si no hay. */
export async function findApprovedTransactionId(reference: string): Promise<string | null> {
  const privateKey = process.env.WOMPI_PRIVATE_KEY;
  if (!privateKey) {
    console.error("[wompi-reconcile] WOMPI_PRIVATE_KEY no configurado");
    return null;
  }
  try {
    const res = await fetch(`${WOMPI_BASE}/transactions?reference=${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${privateKey}` },
      cache: "no-store",
    });
    if (!res.ok) {
      console.error("[wompi-reconcile] Wompi API error:", res.status, "ref:", reference);
      return null;
    }
    const { data } = await res.json();
    const approved = (data ?? []).find((tx: { status: string }) => tx.status === "APPROVED");
    return approved?.id ?? null;
  } catch (err) {
    console.error("[wompi-reconcile] Error consultando Wompi:", err);
    return null;
  }
}

/**
 * Marca el pedido como pagado. El update es atómico: si otro proceso (webhook, redirect)
 * ya lo confirmó devuelve false y no se repiten los correos.
 */
export async function confirmPaidOrder(
  db: Db,
  order: { id: string; order_number: string; status: string; cart_session_id?: string | null; wompi_reference: string; items?: { variant_id: string; quantity: number }[] },
  transactionId: string,
  note: string
): Promise<boolean> {
  for (const item of order.items ?? []) {
    const { error } = await db.rpc("confirm_stock_sale", {
      p_variant_id: item.variant_id,
      p_session_id: order.cart_session_id ?? order.wompi_reference,
      p_quantity: item.quantity,
      p_order_id: order.id,
    });
    if (error) console.error("[wompi-reconcile] confirm_stock_sale error:", error);
  }

  const { data: updated, error: updateErr } = await db
    .from("orders")
    .update({ status: "paid", wompi_transaction_id: transactionId, paid_at: new Date().toISOString() })
    .eq("id", order.id)
    .in("status", RECOVERABLE)
    .is("paid_at", null)
    .select("id");

  if (updateErr) {
    console.error("[wompi-reconcile] Error actualizando pedido:", updateErr);
    return false;
  }
  if (!updated?.length) return false;

  await db.from("order_status_log").insert({
    order_id: order.id,
    from_status: order.status,
    to_status: "paid",
    notes: `${note} Transacción: ${transactionId}`,
  });

  const { data: fullOrder } = await db
    .from("orders")
    .select("*, items:order_items(*)")
    .eq("id", order.id)
    .single();
  if (fullOrder) {
    await sendEmailsSafe(
      `reconcile/${order.order_number}`,
      sendOrderConfirmationEmail(fullOrder),
      sendNewOrderAdminEmail(fullOrder),
    );
  }
  return true;
}

/**
 * Consulta a Wompi por la referencia del pedido y, si hay un pago aprobado, lo confirma.
 * Sirve para pedidos pendientes o ya cancelados por timeout. Devuelve true si quedó pagado.
 */
export async function reconcileWompiOrder(
  db: Db,
  order: { id: string; order_number: string; status: string; paid_at?: string | null; payment_method: string; cart_session_id?: string | null; wompi_reference: string | null; items?: { variant_id: string; quantity: number }[] }
): Promise<boolean> {
  if (order.payment_method !== "wompi" || !order.wompi_reference) return false;
  if (!isRecoverable(order)) return false;

  const txId = await findApprovedTransactionId(order.wompi_reference);
  if (!txId) return false;

  const confirmed = await confirmPaidOrder(
    db,
    { ...order, wompi_reference: order.wompi_reference },
    txId,
    "Pago confirmado por verificación directa con Wompi."
  );
  if (confirmed) console.log("[wompi-reconcile] Pedido recuperado:", order.order_number, "estado previo:", order.status);
  return confirmed;
}

export type WompiCheckResult =
  | "recovered" // Wompi tenía el pago aprobado y el pedido quedó como pagado
  | "already_paid" // Wompi lo aprobó, pero otro proceso ya lo había confirmado
  | "pending" // Wompi aún está procesando un pago: no tocar el pedido
  | "unpaid" // Wompi no tiene pago aprobado ni en proceso para este pedido
  | "unknown"; // no se pudo consultar a Wompi

/**
 * Revisa un pedido pendiente o cancelado contra Wompi con una sola consulta y dice qué pasó.
 * Solo confirma pedidos con pago aprobado; nunca cancela ni modifica los demás.
 */
export async function checkWompiOrder(
  db: Db,
  order: { id: string; order_number: string; status: string; paid_at?: string | null; payment_method: string; cart_session_id?: string | null; wompi_reference: string | null; items?: { variant_id: string; quantity: number }[] }
): Promise<WompiCheckResult> {
  if (order.payment_method !== "wompi" || !order.wompi_reference || !isRecoverable(order)) {
    return "unknown";
  }

  const privateKey = process.env.WOMPI_PRIVATE_KEY;
  if (!privateKey) return "unknown";

  let transactions: { id: string; status: string }[];
  try {
    const res = await fetch(`${WOMPI_BASE}/transactions?reference=${encodeURIComponent(order.wompi_reference)}`, {
      headers: { Authorization: `Bearer ${privateKey}` },
      cache: "no-store",
    });
    if (!res.ok) return "unknown";
    transactions = (await res.json()).data ?? [];
  } catch {
    return "unknown";
  }

  const approved = transactions.find((tx) => tx.status === "APPROVED");
  if (approved) {
    const confirmed = await confirmPaidOrder(
      db,
      { ...order, wompi_reference: order.wompi_reference },
      approved.id,
      "Pago confirmado por verificación masiva desde el panel de pedidos."
    );
    return confirmed ? "recovered" : "already_paid";
  }

  if (transactions.some((tx) => tx.status === "PENDING")) return "pending";
  return "unpaid";
}
