import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import { formatCOP, formatDate, formatPhone } from "@/lib/utils/format";
import { OrderStatusActions } from "@/components/admin/OrderStatusActions";
import { VerifyPaymentButton } from "@/components/admin/VerifyPaymentButton";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AdminPedidoDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = createServiceClient();

  const { data: order } = await supabase
    .from("orders")
    .select(`
      *,
      items:order_items(*),
      status_log:order_status_log(*, changed_by)
    `)
    .eq("id", id)
    .single();

  if (!order) notFound();

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-4 mb-6">
        <a href="/admin/pedidos" className="text-[#766A63] hover:text-[#221A33] text-sm">
          ← Volver
        </a>
        <h1
          className="text-2xl text-[#221A33]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {order.order_number}
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
        {/* Info clienta */}
        <div className="bg-white border border-[#E8DED4] p-5">
          <h2 className="text-[10px] tracking-[0.2em] uppercase text-[#766A63] font-[600] mb-3">Clienta</h2>
          <p className="text-sm text-[#221A33] font-[500]">{order.shipping_name}</p>
          {order.customer_id_number && (
            <p className="text-xs text-[#766A63]">
              {order.customer_id_type ?? "CC"} {order.customer_id_number}
            </p>
          )}
          <p className="text-xs text-[#766A63]">{order.shipping_email}</p>
          <p className="text-xs text-[#766A63]">{formatPhone(order.shipping_phone)}</p>
          <p className="text-xs text-[#766A63] mt-2">
            {order.shipping_address}, {order.shipping_city}, {order.shipping_department}
          </p>
        </div>

        {/* Totales */}
        <div className="bg-white border border-[#E8DED4] p-5">
          <h2 className="text-[10px] tracking-[0.2em] uppercase text-[#766A63] font-[600] mb-3">Totales</h2>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between text-[#766A63]">
              <span>Subtotal</span><span>{formatCOP(order.subtotal)}</span>
            </div>
            {order.discount_amount > 0 && (
              <div className="flex justify-between text-[#A0526C]">
                <span>Descuento</span><span>−{formatCOP(order.discount_amount)}</span>
              </div>
            )}
            <div className="flex justify-between text-[#766A63]">
              <span>Envío</span><span>{formatCOP(order.shipping_cost)}</span>
            </div>
            <div className="flex justify-between font-[600] text-[#221A33] pt-1 border-t border-[#E8DED4]">
              <span>Total</span><span>{formatCOP(order.total)}</span>
            </div>
            <div className="flex justify-between text-[#766A63] pt-1 border-t border-[#F7F2EC]">
              <span>Método de pago</span>
              {order.payment_method === "contraentrega" ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#F7F2EC] border border-[#DCCFC4] text-[#766A63] text-[10px] uppercase tracking-wide font-[500]">
                  Contraentrega
                </span>
              ) : (
                <span className="text-[#766A63] text-xs">Wompi / Online</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Prendas */}
      <div className="bg-white border border-[#E8DED4] p-5 mb-5">
        <h2 className="text-[10px] tracking-[0.2em] uppercase text-[#766A63] font-[600] mb-4">Prendas</h2>
        <div className="space-y-3">
          {(order.items ?? []).map((item: any) => (
            <div key={item.id} className="flex justify-between text-sm border-b border-[#F7F2EC] pb-2">
              <div>
                <p className="text-[#221A33] font-[400]">{item.product_name}</p>
                <p className="text-xs text-[#766A63]">
                  SKU: {item.variant_sku} · {Object.entries(item.variant_attrs ?? {}).map(([k,v])=>`${k}: ${v}`).join(" · ")} · ×{item.quantity}
                </p>
              </div>
              <span className="text-[#221A33] font-[500]">{formatCOP(item.total_price)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Acciones de estado */}
      <div className="bg-white border border-[#E8DED4] p-5 mb-5">
        <h2 className="text-[10px] tracking-[0.2em] uppercase text-[#766A63] font-[600] mb-4">
          Estado del pedido
        </h2>
        <OrderStatusActions order={order} />

        {/* Verificación manual de pago — solo para pedidos online cancelados o pendientes */}
        {order.payment_method === "wompi" &&
          (order.status === "cancelled" || order.status === "pending_payment") && (
          <VerifyPaymentButton orderId={order.id} orderNumber={order.order_number} />
        )}
      </div>

      {/* Log de estados */}
      <div className="bg-white border border-[#E8DED4] p-5">
        <h2 className="text-[10px] tracking-[0.2em] uppercase text-[#766A63] font-[600] mb-4">
          Historial de cambios
        </h2>
        <div className="space-y-3">
          {(order.status_log ?? []).sort((a: any, b: any) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          ).map((log: any) => (
            <div key={log.id} className="flex gap-3 text-xs">
              <div className="w-2 h-2 rounded-full bg-[#A0526C] shrink-0 mt-1" />
              <div>
                <p className="text-[#221A33]">{log.notes ?? `${log.from_status} → ${log.to_status}`}</p>
                <p className="text-[#766A63] mt-0.5">{formatDate(log.created_at)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
