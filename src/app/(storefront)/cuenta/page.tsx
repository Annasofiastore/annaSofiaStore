import { redirect } from "next/navigation";
import Link from "next/link";
import { Package, Heart, MapPin, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatCOP, formatDate } from "@/lib/utils/format";

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  pending_payment: { label: "Pendiente de pago", cls: "text-amber-700 bg-amber-50" },
  paid: { label: "Pagado", cls: "text-blue-700 bg-blue-50" },
  preparing: { label: "En preparación", cls: "text-purple-700 bg-purple-50" },
  shipped: { label: "Enviado", cls: "text-cyan-700 bg-cyan-50" },
  delivered: { label: "Entregado", cls: "text-green-700 bg-green-50" },
  cancelled: { label: "Cancelado", cls: "text-gray-500 bg-gray-100" },
};

export const metadata = { title: "Mi cuenta" };

export default async function CuentaDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?redirect=/cuenta");

  const { data: customer } = await supabase
    .from("customers")
    .select("id")
    .eq("auth_user_id", user.id)
    .single();

  const [ordersRes, wishlistRes] = await Promise.all([
    customer
      ? supabase
          .from("orders")
          .select("id, order_number, status, total, created_at")
          .eq("customer_id", customer.id)
          .order("created_at", { ascending: false })
          .limit(3)
      : Promise.resolve({ data: [] }),
    customer
      ? supabase
          .from("wishlists")
          .select("id", { count: "exact", head: true })
          .eq("customer_id", customer.id)
      : Promise.resolve({ count: 0 }),
  ]);

  const orders = (ordersRes as any).data ?? [];
  const wishlistCount = (wishlistRes as any).count ?? 0;

  return (
    <div className="space-y-5">
      {/* Quick links */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {
            href: "/cuenta/pedidos",
            icon: Package,
            label: "Pedidos",
            sub: orders.length ? `${orders.length} recientes` : "Ver todos",
          },
          {
            href: "/cuenta/wishlist",
            icon: Heart,
            label: "Wishlist",
            sub: `${wishlistCount} guardado${wishlistCount !== 1 ? "s" : ""}`,
          },
          {
            href: "/cuenta/direcciones",
            icon: MapPin,
            label: "Direcciones",
            sub: "Gestionar",
          },
        ].map(({ href, icon: Icon, label, sub }) => (
          <Link
            key={href}
            href={href}
            className="bg-white border border-[#E8DED4] p-4 hover:border-[#A0526C] transition-colors group"
          >
            <Icon size={18} className="text-[#A0526C] mb-2" />
            <p className="text-[11px] font-[600] text-[#1C1B2E] uppercase tracking-[0.1em]">
              {label}
            </p>
            <p className="text-[11px] text-[#766A63] mt-0.5">{sub}</p>
          </Link>
        ))}
      </div>

      {/* Pedidos recientes */}
      <div className="bg-white border border-[#E8DED4]">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#F7F2EC]">
          <p className="text-[11px] uppercase tracking-[0.15em] font-[600] text-[#1C1B2E]">
            Pedidos recientes
          </p>
          <Link
            href="/cuenta/pedidos"
            className="inline-flex items-center gap-1 text-[11px] text-[#766A63] hover:text-[#1C1B2E] transition-colors tracking-wide"
          >
            Ver todos <ArrowRight size={11} />
          </Link>
        </div>

        {orders.length === 0 ? (
          <div className="py-12 text-center">
            <Package size={32} className="mx-auto mb-3 text-[#DCCFC4]" />
            <p className="text-sm text-[#766A63]">Aún no tienes pedidos.</p>
            <Link
              href="/catalogo"
              className="inline-block mt-3 text-[11px] uppercase tracking-[0.15em] text-[#1C1B2E] border-b border-[#1C1B2E] pb-0.5"
            >
              Ir al catálogo
            </Link>
          </div>
        ) : (
          orders.map((order: any) => {
            const s =
              STATUS_MAP[order.status] ?? { label: order.status, cls: "text-gray-500 bg-gray-100" };
            return (
              <Link
                key={order.id}
                href={`/cuenta/pedidos/${order.id}`}
                className="flex items-center justify-between px-5 py-4 border-b border-[#F7F2EC] last:border-0 hover:bg-[#F7F2EC]/50 transition-colors"
              >
                <div>
                  <p className="text-sm font-[600] text-[#1C1B2E]">{order.order_number}</p>
                  <p className="text-[11px] text-[#766A63] mt-0.5">{formatDate(order.created_at)}</p>
                </div>
                <div className="text-right">
                  <span
                    className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-[500] ${s.cls}`}
                  >
                    {s.label}
                  </span>
                  <p className="text-sm font-[600] text-[#1C1B2E] mt-1">{formatCOP(order.total)}</p>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
