import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/server";
import { formatCOP, formatDateShort } from "@/lib/utils/format";
import { ExportPedidosButton } from "@/components/admin/ExportPedidosButton";
import { OrderDateFilter } from "@/components/admin/OrderDateFilter";

const STATUS_OPTIONS = [
  { value: "", label: "Todos los estados" },
  { value: "pending_payment", label: "Pendiente de pago" },
  { value: "paid", label: "Pagados" },
  { value: "preparing", label: "En preparación" },
  { value: "shipped", label: "Enviados" },
  { value: "delivered", label: "Entregados" },
  { value: "cancelled", label: "Cancelados" },
];

const STATUS_BADGE: Record<string, string> = {
  pending_payment: "bg-yellow-100 text-yellow-800",
  paid: "bg-green-100 text-green-800",
  preparing: "bg-blue-100 text-blue-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-[#F2D4DC] text-[#1E1B2E]",
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
  searchParams: Promise<{ status?: string; q?: string; date_from?: string; date_to?: string }>;
}

function buildStatusHref(statusValue: string, dateFrom?: string, dateTo?: string, q?: string) {
  const p = new URLSearchParams();
  if (statusValue) p.set("status", statusValue);
  if (dateFrom) p.set("date_from", dateFrom);
  if (dateTo) p.set("date_to", dateTo);
  if (q) p.set("q", q);
  const qs = p.toString();
  return qs ? `/admin/pedidos?${qs}` : "/admin/pedidos";
}

export default async function AdminPedidosPage({ searchParams }: Props) {
  const { status, q, date_from, date_to } = await searchParams;
  const supabase = createServiceClient();

  let query = supabase
    .from("orders")
    .select("id, order_number, shipping_name, shipping_email, shipping_city, total, status, payment_method, created_at, tracking_number")
    .order("created_at", { ascending: false })
    .limit(200);

  if (status) query = query.eq("status", status);
  if (q) query = query.ilike("order_number", `%${q}%`);

  // Colombia = UTC-5: filtrar el día completo en hora local
  if (date_from) query = query.gte("created_at", `${date_from}T00:00:00-05:00`);
  if (date_to) query = query.lte("created_at", `${date_to}T23:59:59-05:00`);

  const { data: orders } = await query;

  const hasDateFilter = !!(date_from || date_to);

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <h1
          className="text-3xl text-[#1E1B2E]"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Pedidos
        </h1>
        <ExportPedidosButton currentStatus={status} />
      </div>

      {/* Filtros de estado */}
      <div className="flex gap-3 mb-4 flex-wrap">
        {STATUS_OPTIONS.map((opt) => (
          <Link
            key={opt.value}
            href={buildStatusHref(opt.value, date_from, date_to, q)}
            className={`text-[10px] tracking-[0.15em] uppercase px-4 py-2 border font-[500] transition-colors ${
              (status ?? "") === opt.value
                ? "bg-[#1E1B2E] text-[#FAF6F7] border-[#1E1B2E]"
                : "border-[#E9DDE3] text-[#6E6680] hover:border-[#6E6680]"
            }`}
          >
            {opt.label}
          </Link>
        ))}
      </div>

      {/* Filtro de fecha */}
      <div className={`flex items-center gap-4 mb-6 px-4 py-3 border flex-wrap ${hasDateFilter ? "border-[#F2D4DC] bg-[#F2D4DC]/10" : "border-[#E9DDE3] bg-white"}`}>
        <OrderDateFilter />
        {hasDateFilter && (
          <span className="text-[10px] text-[#6E6680]">
            {(orders ?? []).length} pedido{(orders ?? []).length !== 1 ? "s" : ""} en el período
          </span>
        )}
      </div>

      {/* Tabla */}
      <div className="bg-white border border-[#E9DDE3] overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#E9DDE3]">
              {["Pedido", "Clienta", "Ciudad", "Total", "Pago", "Estado", "Fecha", ""].map((h) => (
                <th key={h} className="text-left text-[9px] tracking-[0.2em] uppercase text-[#6E6680] font-[600] px-4 py-3">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(orders ?? []).map((order) => (
              <tr key={order.id} className="border-b border-[#FAF6F7] hover:bg-[#FAF6F7]/50 transition-colors">
                <td className="px-4 py-3 font-[500] text-[#1E1B2E]">{order.order_number}</td>
                <td className="px-4 py-3">
                  <p className="text-[#1E1B2E]">{order.shipping_name}</p>
                  <p className="text-xs text-[#6E6680]">{order.shipping_email}</p>
                </td>
                <td className="px-4 py-3 text-[#6E6680]">{order.shipping_city}</td>
                <td className="px-4 py-3 font-[500] text-[#1E1B2E]">{formatCOP(order.total)}</td>
                <td className="px-4 py-3">
                  <span
                    className={`text-[9px] px-2 py-0.5 rounded-full font-[600] tracking-wide uppercase ${
                      order.payment_method === "contraentrega"
                        ? "bg-orange-100 text-orange-700"
                        : "bg-[#F2D4DC]/50 text-[#1E1B2E]"
                    }`}
                  >
                    {order.payment_method === "contraentrega" ? "Contraentrega" : "En línea"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-[600] tracking-wide uppercase ${STATUS_BADGE[order.status] ?? "bg-gray-100 text-gray-600"}`}>
                    {STATUS_LABEL[order.status] ?? order.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-[#6E6680] text-xs whitespace-nowrap">
                  {formatDateShort(order.created_at)}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/pedidos/${order.id}`}
                    className="text-xs text-[#A0647E] hover:text-[#1E1B2E] font-[500]"
                  >
                    Ver →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!orders?.length && (
          <div className="py-16 text-center text-[#6E6680] text-sm">
            No hay pedidos con estos filtros.
          </div>
        )}
      </div>
    </div>
  );
}
