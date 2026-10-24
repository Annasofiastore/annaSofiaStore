import { createServiceClient } from "@/lib/supabase/server";
import { formatCOP } from "@/lib/utils/format";
import { TrendingUp, ShoppingBag, Users, Package, Receipt } from "lucide-react";
import { ReportDateRangeFilter } from "@/components/admin/ReportDateRangeFilter";

const REVENUE_STATUSES = ["paid", "preparing", "shipped", "delivered"];

const MONTH_LABEL: Record<string, string> = {
  "01": "Ene", "02": "Feb", "03": "Mar", "04": "Abr", "05": "May", "06": "Jun",
  "07": "Jul", "08": "Ago", "09": "Sep", "10": "Oct", "11": "Nov", "12": "Dic",
};

function defaultFrom() {
  const d = new Date();
  d.setMonth(d.getMonth() - 5, 1); // últimos 6 meses (incluyendo el actual)
  return d.toISOString().slice(0, 10);
}

function defaultTo() {
  return new Date().toISOString().slice(0, 10);
}

function monthLabel(key: string) {
  const [year, month] = key.split("-");
  return `${MONTH_LABEL[month] ?? month} ${year}`;
}

async function getReportData(from: string, to: string) {
  const supabase = createServiceClient();
  const fromDate = new Date(`${from}T00:00:00`).toISOString();
  const toDate = new Date(`${to}T23:59:59.999`).toISOString();

  const [rangeOrders, totalCustomers, recentOrders] = await Promise.all([
    supabase
      .from("orders")
      .select("id, total, status, created_at")
      .gte("created_at", fromDate)
      .lte("created_at", toDate)
      .in("status", REVENUE_STATUSES),
    supabase.from("customers").select("id", { count: "exact", head: true }),
    supabase
      .from("orders")
      .select("id, order_number, shipping_name, total, status, created_at")
      .gte("created_at", fromDate)
      .lte("created_at", toDate)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const orders = rangeOrders.data ?? [];
  const totalRevenue = orders.reduce((s, o) => s + Number(o.total), 0);
  const totalOrders = orders.length;
  const avgTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Ventas por mes dentro del rango seleccionado
  const monthMap: Record<string, { revenue: number; orders: number }> = {};
  for (const o of orders) {
    const key = (o.created_at as string).slice(0, 7); // YYYY-MM
    if (!monthMap[key]) monthMap[key] = { revenue: 0, orders: 0 };
    monthMap[key].revenue += Number(o.total);
    monthMap[key].orders += 1;
  }
  const monthlySales = Object.entries(monthMap)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, stats]) => ({ month, ...stats }));

  const maxMonthlyRevenue = Math.max(1, ...monthlySales.map((m) => m.revenue));

  // Comparación contra el mes anterior dentro del rango (si hay al menos 2 meses)
  let growth: number | null = null;
  if (monthlySales.length >= 2) {
    const last = monthlySales[monthlySales.length - 1].revenue;
    const prev = monthlySales[monthlySales.length - 2].revenue;
    growth = prev > 0 ? ((last - prev) / prev) * 100 : null;
  }

  // Top productos del periodo
  const orderIds = orders.map((o) => o.id);
  let topProductsList: [string, { qty: number; revenue: number }][] = [];
  if (orderIds.length) {
    const { data: items } = await supabase
      .from("order_items")
      .select("product_name, quantity, total_price")
      .in("order_id", orderIds);

    const productMap: Record<string, { qty: number; revenue: number }> = {};
    for (const item of items ?? []) {
      if (!productMap[item.product_name]) productMap[item.product_name] = { qty: 0, revenue: 0 };
      productMap[item.product_name].qty += item.quantity;
      productMap[item.product_name].revenue += Number(item.total_price);
    }
    topProductsList = Object.entries(productMap)
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .slice(0, 5);
  }

  return {
    totalRevenue,
    totalOrders,
    avgTicket,
    growth,
    totalCustomers: totalCustomers.count ?? 0,
    monthlySales,
    maxMonthlyRevenue,
    topProductsList,
    recentOrders: recentOrders.data ?? [],
  };
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

interface Props {
  searchParams: Promise<{ from?: string; to?: string }>;
}

export default async function AdminReportesPage({ searchParams }: Props) {
  const params = await searchParams;
  const from = params.from ?? defaultFrom();
  const to = params.to ?? defaultTo();

  const data = await getReportData(from, to);

  return (
    <div className="p-6 max-w-5xl space-y-8">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-xl font-semibold text-gray-800">Reportes</h1>
        <ReportDateRangeFilter from={from} to={to} />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            icon: TrendingUp,
            label: "Ingresos del periodo",
            value: formatCOP(data.totalRevenue),
            sub:
              data.growth !== null
                ? `${data.growth >= 0 ? "+" : ""}${data.growth.toFixed(1)}% vs mes anterior`
                : null,
            color: data.growth !== null && data.growth < 0 ? "text-red-500" : "text-green-600",
          },
          {
            icon: ShoppingBag,
            label: "Pedidos en el periodo",
            value: data.totalOrders.toLocaleString("es-CO"),
            sub: null,
            color: "text-blue-600",
          },
          {
            icon: Receipt,
            label: "Ticket promedio",
            value: formatCOP(data.avgTicket),
            sub: null,
            color: "text-[#A0526C]",
          },
          {
            icon: Users,
            label: "Clientes registrados",
            value: data.totalCustomers.toLocaleString("es-CO"),
            sub: null,
            color: "text-purple-600",
          },
        ].map(({ icon: Icon, label, value, sub, color }) => (
          <div key={label} className="bg-white border border-gray-200 rounded p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-gray-500">{label}</p>
              <Icon size={16} className={color} />
            </div>
            <p className="text-2xl font-semibold text-gray-800">{value}</p>
            {sub && <p className={`text-xs mt-1 ${color}`}>{sub}</p>}
          </div>
        ))}
      </div>

      {/* Ventas por mes */}
      <div className="bg-white border border-gray-200 rounded overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3.5 border-b border-gray-100">
          <TrendingUp size={15} className="text-gray-400" />
          <p className="text-sm font-[600] text-gray-800">Movimiento de ventas por mes</p>
        </div>
        {data.monthlySales.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-8">Sin pedidos en este periodo.</p>
        ) : (
          <div className="px-5 py-4 space-y-3">
            {data.monthlySales.map((m) => (
              <div key={m.month} className="flex items-center gap-4">
                <span className="text-xs text-gray-600 w-20 shrink-0">{monthLabel(m.month)}</span>
                <div className="flex-1 h-6 bg-gray-100 rounded relative overflow-hidden">
                  <div
                    className="h-full bg-[#A0526C] rounded"
                    style={{ width: `${(m.revenue / data.maxMonthlyRevenue) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-[600] text-gray-800 w-28 text-right shrink-0">
                  {formatCOP(m.revenue)}
                </span>
                <span className="text-xs text-gray-400 w-20 text-right shrink-0">
                  {m.orders} {m.orders === 1 ? "pedido" : "pedidos"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top productos */}
        <div className="bg-white border border-gray-200 rounded overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3.5 border-b border-gray-100">
            <Package size={15} className="text-gray-400" />
            <p className="text-sm font-[600] text-gray-800">Productos más vendidos en el periodo</p>
          </div>
          {data.topProductsList.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-8">Sin datos.</p>
          ) : (
            <div>
              {data.topProductsList.map(([name, stats], i) => (
                <div
                  key={name}
                  className="flex items-center justify-between px-5 py-3 border-b border-gray-50 last:border-0"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-[600] text-gray-300 w-5 shrink-0">{i + 1}</span>
                    <p className="text-sm text-gray-700 truncate">{name}</p>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className="text-sm font-[600] text-gray-800">{formatCOP(stats.revenue)}</p>
                    <p className="text-xs text-gray-400">{stats.qty} uds</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pedidos recientes */}
        <div className="bg-white border border-gray-200 rounded overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3.5 border-b border-gray-100">
            <ShoppingBag size={15} className="text-gray-400" />
            <p className="text-sm font-[600] text-gray-800">Pedidos recientes del periodo</p>
          </div>
          {data.recentOrders.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-8">Sin pedidos.</p>
          ) : (
            <div>
              {data.recentOrders.map((o: any) => (
                <div
                  key={o.id}
                  className="flex items-center justify-between px-5 py-3 border-b border-gray-50 last:border-0"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-[500] text-gray-800">{o.order_number}</p>
                    <p className="text-xs text-gray-400 truncate">{o.shipping_name}</p>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className="text-sm font-[600] text-gray-800">{formatCOP(o.total)}</p>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-[500] ${
                        STATUS_BADGE[o.status] ?? "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {STATUS_LABEL[o.status] ?? o.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
