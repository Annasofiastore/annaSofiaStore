import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { sendOrderStatusEmail } from "@/lib/email/templates";
import type { OrderStatus } from "@/types";

const VALID_TRANSITIONS: Record<string, OrderStatus[]> = {
  paid: ["preparing"],
  preparing: ["shipped", "cancelled"],
  shipped: ["delivered"],
};

// Contraentrega nace "Pendiente de pago" (el cobro llega al entregar) y se prepara igual que los demás.
const CONTRAENTREGA_PENDING: OrderStatus[] = ["preparing", "cancelled"];

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Verificar autenticación del admin
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  // Esta ruta cambia estados y registra pagos: se exige el rol admin, no solo una sesión iniciada
  if (!user || user.app_metadata?.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { status, trackingNumber, courier } = await req.json();

  const service = await createServiceClient();

  // Obtener pedido actual
  const { data: order } = await service.from("orders").select("*").eq("id", id).single();
  if (!order) return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });

  const isContraentrega = order.payment_method === "contraentrega";

  // Validar transición — RB-ADM-02
  const allowed =
    isContraentrega && order.status === "pending_payment"
      ? CONTRAENTREGA_PENDING
      : VALID_TRANSITIONS[order.status] ?? [];
  if (!allowed.includes(status)) {
    return NextResponse.json(
      { error: `Transición inválida: ${order.status} → ${status}` },
      { status: 400 }
    );
  }

  const updates: Record<string, string | null> = { status };
  if (status === "shipped") {
    updates.tracking_number = trackingNumber || null;
    updates.courier = courier || null;
    updates.shipped_at = new Date().toISOString();
  }
  if (status === "delivered") {
    updates.delivered_at = new Date().toISOString();
  }

  // Contraentrega: al entregarse se recibe el pago. paid_at dispara el registro del cupón (trigger en la base).
  const collectsPayment = status === "delivered" && isContraentrega && !order.paid_at;
  if (collectsPayment) {
    updates.paid_at = new Date().toISOString();
  }

  // Update atómico: solo si el pedido sigue en el estado que leímos
  const { data: changed, error: updateErr } = await service
    .from("orders")
    .update(updates)
    .eq("id", id)
    .eq("status", order.status)
    .select("id");
  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });
  if (!changed?.length) {
    return NextResponse.json(
      { error: "El pedido cambió de estado mientras lo editabas. Recarga la página." },
      { status: 409 }
    );
  }

  // Pedido cancelado antes de enviarse: las unidades vuelven al inventario
  if (status === "cancelled") {
    const { error } = await service.rpc("restore_order_stock", { p_order_id: id });
    if (error) console.error("[admin/status] restore_order_stock error:", error);
  }

  // Log auditable — RB-PED-04
  await service.from("order_status_log").insert({
    order_id: id,
    from_status: order.status,
    to_status: status,
    changed_by: user.id,
    notes: collectsPayment
      ? `Entregado — pago recibido contra entrega (registrado por ${user.email ?? user.id})`
      : trackingNumber
        ? `Guía: ${trackingNumber} · ${courier ?? ""}`
        : null,
  });

  // Notificación a la clienta — RB-PED-03
  const updatedOrder = { ...order, ...updates };
  await sendOrderStatusEmail(updatedOrder, status).catch(console.error);

  return NextResponse.json({ ok: true });
}
