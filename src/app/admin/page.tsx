import { createServiceClient } from "@/lib/supabase/server";
import { formatCOP } from "@/lib/utils/format";
import { ShoppingBag, DollarSign, Users, AlertTriangle } from "lucide-react";
import { getStoreName } from "@/lib/config/store-name";

async function getDashboardStats() {
  const supabase = createServiceClient();
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
  const startOfToday = new Date(today.setHours(0, 0, 0, 0)).toISOString();

  const [todayOrders, monthOrders, totalCustomers, lowStock] = await Promise.all([
    supabase
      .from("orders")
      .select("id, total, status")
      .gte("created_at", startOfToday)
      .in("status", ["paid", "preparing", "shipped", "delivered"]),
    supabase
      .from("orders")
      .select("id, total")
      .gte("created_at", startOfMonth)
      .in("status", ["paid", "preparing", "shipped", "delivered"]),
    supabase.from("customers").select("id", { count: "exact", head: true }),
    supabase
      .from("product_variants")
      .select("id, sku, stock, reserved, product_id, products(name)")
      .lte("stock", 3)
      .gt("stock", 0),
  ]);

  const todaySales = (todayOrders.data ?? []).reduce((s, o) => s + o.total, 0);
  const monthSales = (monthOrders.data ?? []).reduce((s, o) => s + o.total, 0);
  const pendingOrders = (todayOrders.data ?? []).filter(
    (o) => o.status === "paid" || o.status === "preparing"
  ).length;

  return {
    todaySales,
    todayOrders: todayOrders.data?.length ?? 0,
    monthSales,
    monthOrders: monthOrders.data?.length ?? 0,
    totalCustomers: totalCustomers.count ?? 0,
    pendingOrders,
    lowStock: lowStock.data ?? [],
  };
}

async function getRecentOrders() {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("orders")
    .select("id, order_number, shipping_name, total, status, created_at")
    .order("created_at", { ascending: false })
    .limit(8);
  return data ?? [];
}

const STATUS_BADGE: Record<string, string> = {
  pending_payment: "bg-yellow-100 text-yellow-800",
  paid: "bg-green-100 text-green-800",
  preparing: "bg-blue-100 text-blue-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-[#F5DDE5] text-[#221A33]",
  cancelled: "bg-red-100 text-red-700",
};
const STATUS_LABEL: Record<string, string> = {
  pending_payment: "Pendiente",
  paid: "Pagado",
  preparing: "Preparando",
  shipped: "Enviado",
  delivered: "Entregado",
  cancelled: "Cancelado",
};

export default async function AdminDashboard() {
  const storeName = await getStoreName();
  const [stats, recentOrders] = await Promise.all([getDashboardStats(), getRecentOrders()]);

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1
          className="text-3xl text-[#221A33]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Dashboard
        </h1>
        <p className="text-sm text-[#766A63] mt-1">Resumen de operaciones de {storeName}</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Ventas hoy"
          value={formatCOP(stats.todaySales)}
          sub={`${stats.todayOrders} pedidos`}
          icon={<DollarSign size={20} strokeWidth={1.5} className="text-[#A0526C]" />}
        />
        <StatCard
          title="Ventas del mes"
          value={formatCOP(stats.monthSales)}
          sub={`${stats.monthOrders} pedidos`}
          icon={<DollarSign size={20} strokeWidth={1.5} className="text-[#A0526C]" />}
        />
        <StatCard
          title="Pedidos pendientes"
          value={String(stats.pendingOrders)}
          sub="por despachar"
          icon={<ShoppingBag size={20} strokeWidth={1.5} className="text-[#A0526C]" />}
          alert={stats.pendingOrders > 0}
        />
        <StatCard
          title="Clientas totales"
          value={String(stats.totalCustomers)}
          sub="registradas + invitadas"
          icon={<Users size={20} strokeWidth={1.5} className="text-[#A0526C]" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* PEDIDOS RECIENTES */}
        <div className="lg:col-span-2 bg-white border border-[#E8DED4] p-6">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-[10px] tracking-[0.25em] uppercase text-[#766A63] font-[600]">
              Pedidos recientes
            </h2>
            <a href="/admin/pedidos" className="text-xs text-[#A0526C] hover:text-[#221A33]">
              Ver todos →
            </a>
          </div>
          <div className="space-y-0">
            {recentOrders.map((order, idx) => (
              <a
                key={order.id}
                href={`/admin/pedidos/${order.id}`}
                className={`flex items-center justify-between py-3 hover:bg-[#F7F2EC] -mx-2 px-2 transition-colors ${idx !== 0 ? "border-t border-[#F7F2EC]" : ""}`}
              >
                <div>
                  <p className="text-sm text-[#221A33] font-[500]">{order.order_number}</p>
                  <p className="text-xs text-[#766A63]">{order.shipping_name}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-[600] tracking-wide uppercase ${STATUS_BADGE[order.status] ?? "bg-gray-100 text-gray-600"}`}>
                    {STATUS_LABEL[order.status] ?? order.status}
                  </span>
                  <span className="text-sm text-[#221A33] font-[500]">
                    {formatCOP(order.total)}
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* STOCK BAJO */}
        <div className="bg-white border border-[#E8DED4] p-6">
          <h2 className="text-[10px] tracking-[0.25em] uppercase text-[#766A63] font-[600] mb-5">
            Stock bajo (≤ 3 uds)
          </h2>
          {stats.lowStock.length === 0 ? (
            <p className="text-sm text-[#DCCFC4]">Sin alertas de stock.</p>
          ) : (
            <div className="space-y-3">
              {stats.lowStock.map((v: any) => (
                <div key={v.id} className="flex items-start gap-2">
                  <AlertTriangle size={14} className="text-[#A0526C] shrink-0 mt-0.5" strokeWidth={1.5} />
                  <div>
                    <p className="text-xs text-[#221A33] font-[500] leading-snug">
                      {v.products?.name ?? v.sku}
                    </p>
                    <p className="text-[10px] text-[#766A63]">
                      {v.sku} · {v.stock} disponibles
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
          <a
            href="/admin/inventario"
            className="block mt-4 text-xs text-[#A0526C] hover:text-[#221A33]"
          >
            Ver inventario completo →
          </a>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title, value, sub, icon, alert,
}: {
  title: string; value: string; sub: string; icon: React.ReactNode; alert?: boolean;
}) {
  return (
    <div className={`bg-white border p-5 ${alert ? "border-[#A0526C]" : "border-[#E8DED4]"}`}>
      <div className="flex justify-between items-start mb-3">
        <p className="text-[9px] tracking-[0.2em] uppercase text-[#766A63] font-[600]">{title}</p>
        {icon}
      </div>
      <p className="text-2xl text-[#221A33] font-[600] leading-none mb-1">{value}</p>
      <p className="text-xs text-[#766A63]">{sub}</p>
    </div>
  );
}
