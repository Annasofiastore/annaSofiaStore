import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Package, MapPin, Truck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";
import { formatCOP, formatDate } from "@/lib/utils/format";
import { RetryPaymentBanner } from "@/components/storefront/RetryPaymentBanner";

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  pending_payment: { label: "Pendiente de pago", cls: "text-amber-700 bg-amber-50 border-amber-200" },
  paid: { label: "Pagado", cls: "text-blue-700 bg-blue-50 border-blue-200" },
  preparing: { label: "En preparación", cls: "text-purple-700 bg-purple-50 border-purple-200" },
  shipped: { label: "Enviado", cls: "text-cyan-700 bg-cyan-50 border-cyan-200" },
  delivered: { label: "Entregado", cls: "text-green-700 bg-green-50 border-green-200" },
  cancelled: { label: "Cancelado", cls: "text-gray-500 bg-gray-50 border-gray-200" },
};

export default async function PedidoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?redirect=/cuenta/pedidos");

  const db = createServiceClient();

  // Buscar customer por auth_user_id, si no por email
  let customerId: string | null = null;
  const { data: byAuthId } = await db
    .from("customers")
    .select("id")
    .eq("auth_user_id", user.id)
    .single();

  if (byAuthId) {
    customerId = byAuthId.id;
  } else if (user.email) {
    const { data: byEmail } = await db
      .from("customers")
      .select("id")
      .eq("email", user.email.toLowerCase())
      .single();

    if (byEmail) {
      customerId = byEmail.id;
      await db
        .from("customers")
        .update({ auth_user_id: user.id, is_guest: false })
        .eq("id", byEmail.id);
    }
  }

  if (!customerId) notFound();

  const { data: order } = await db
    .from("orders")
    .select(
      `*, order_items (id, product_name, variant_sku, variant_attrs, quantity, unit_price, total_price)`
    )
    .eq("id", id)
    .eq("customer_id", customerId)
    .single();

  if (!order) notFound();

  const s =
    STATUS_MAP[order.status] ?? {
      label: order.status,
      cls: "text-gray-500 bg-gray-50 border-gray-200",
    };

  return (
    <div>
      <Link
        href="/cuenta/pedidos"
        className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.15em] text-[#766A63] hover:text-[#1F1B19] mb-5 transition-colors"
      >
        <ArrowLeft size={12} /> Mis pedidos
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <h2
            className="text-xl text-[#1F1B19]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {order.order_number}
          </h2>
          <p className="text-xs text-[#766A63] mt-1">{formatDate(order.created_at)}</p>
        </div>
        <span className={`text-[10px] px-3 py-1.5 border font-[500] ${s.cls}`}>{s.label}</span>
      </div>

      {/* Banner de reintento si el pago quedó pendiente */}
      {order.status === "pending_payment" && order.payment_method === "wompi" && (
        <RetryPaymentBanner orderId={order.id} createdAt={order.created_at} />
      )}

      <div className="space-y-4">
        {/* Prendas */}
        <div className="bg-white border border-[#E8DED4]">
          <div className="px-5 py-3 border-b border-[#F7F2EC] flex items-center gap-2">
            <Package size={13} className="text-[#965C57]" />
            <p className="text-[11px] uppercase tracking-[0.15em] font-[600] text-[#1F1B19]">
              Prendas
            </p>
          </div>
          {order.order_items?.map((item: any) => {
            const attrs = item.variant_attrs ?? {};
            const attrStr = Object.values(attrs).filter(Boolean).join(" · ");
            return (
              <div
                key={item.id}
                className="flex items-start justify-between px-5 py-4 border-b border-[#F7F2EC] last:border-0 gap-4"
              >
                <div className="min-w-0">
                  <p className="text-sm font-[500] text-[#1F1B19]">{item.product_name}</p>
                  {attrStr && (
                    <p className="text-[11px] text-[#766A63] mt-0.5">{attrStr}</p>
                  )}
                  <p className="text-[11px] text-[#DCCFC4] mt-0.5">SKU: {item.variant_sku}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-[600] text-[#1F1B19]">
                    {formatCOP(item.total_price)}
                  </p>
                  <p className="text-[11px] text-[#766A63]">
                    {formatCOP(item.unit_price)} × {item.quantity}
                  </p>
                </div>
              </div>
            );
          })}
          {/* Totales */}
          <div className="px-5 py-4 border-t border-[#E8DED4] bg-[#F7F2EC]/40 space-y-2">
            <div className="flex justify-between text-sm text-[#766A63]">
              <span>Subtotal</span>
              <span>{formatCOP(order.subtotal)}</span>
            </div>
            {order.discount_amount > 0 && (
              <div className="flex justify-between text-sm text-[#965C57]">
                <span>Descuento</span>
                <span>−{formatCOP(order.discount_amount)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm text-[#766A63]">
              <span>Envío</span>
              <span>
                {order.shipping_cost > 0 ? formatCOP(order.shipping_cost) : "Gratis"}
              </span>
            </div>
            <div className="flex justify-between text-base font-[600] text-[#1F1B19] pt-2 border-t border-[#E8DED4]">
              <span>Total</span>
              <span>{formatCOP(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Dirección de envío */}
        <div className="bg-white border border-[#E8DED4]">
          <div className="px-5 py-3 border-b border-[#F7F2EC] flex items-center gap-2">
            <MapPin size={13} className="text-[#965C57]" />
            <p className="text-[11px] uppercase tracking-[0.15em] font-[600] text-[#1F1B19]">
              Envío
            </p>
          </div>
          <div className="px-5 py-4 text-sm text-[#766A63] space-y-0.5">
            <p className="text-[#1F1B19] font-[500]">{order.shipping_name}</p>
            <p>{order.shipping_address}</p>
            <p>
              {order.shipping_city}, {order.shipping_department}
            </p>
            <p>{order.shipping_phone}</p>
          </div>
        </div>

        {/* Tracking — solo si fue despachado */}
        {(order.status === "shipped" || order.status === "delivered") &&
          order.tracking_number && (
            <div className="bg-white border border-[#E8DED4]">
              <div className="px-5 py-3 border-b border-[#F7F2EC] flex items-center gap-2">
                <Truck size={13} className="text-[#965C57]" />
                <p className="text-[11px] uppercase tracking-[0.15em] font-[600] text-[#1F1B19]">
                  Seguimiento
                </p>
              </div>
              <div className="px-5 py-4 text-sm space-y-1">
                <p className="text-[#766A63]">
                  Guía:{" "}
                  <span className="text-[#1F1B19] font-[600]">{order.tracking_number}</span>
                </p>
                {order.courier && (
                  <p className="text-[#766A63]">
                    Courier: <span className="text-[#1F1B19]">{order.courier}</span>
                  </p>
                )}
                {order.shipped_at && (
                  <p className="text-[#766A63]">
                    Despachado:{" "}
                    <span className="text-[#1F1B19]">{formatDate(order.shipped_at)}</span>
                  </p>
                )}
              </div>
            </div>
          )}
      </div>
    </div>
  );
}
