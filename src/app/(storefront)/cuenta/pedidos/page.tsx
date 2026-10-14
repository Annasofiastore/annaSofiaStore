import { redirect } from "next/navigation";
import Link from "next/link";
import { Package, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";
import { formatCOP, formatDate } from "@/lib/utils/format";

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  pending_payment: { label: "Pendiente de pago", cls: "text-amber-700 bg-amber-50 border-amber-200" },
  paid: { label: "Pagado", cls: "text-blue-700 bg-blue-50 border-blue-200" },
  preparing: { label: "En preparación", cls: "text-purple-700 bg-purple-50 border-purple-200" },
  shipped: { label: "Enviado", cls: "text-cyan-700 bg-cyan-50 border-cyan-200" },
  delivered: { label: "Entregado", cls: "text-green-700 bg-green-50 border-green-200" },
  cancelled: { label: "Cancelado", cls: "text-gray-500 bg-gray-50 border-gray-200" },
};

export const metadata = { title: "Mis pedidos" };

export default async function PedidosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?redirect=/cuenta/pedidos");

  const db = createServiceClient();

  // Buscar customer por auth_user_id, si no por email (checkout no vincula auth_user_id)
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

  const { data: orders } = customerId
    ? await db
        .from("orders")
        .select("id, order_number, status, total, created_at, shipping_city, shipping_department")
        .eq("customer_id", customerId)
        .order("created_at", { ascending: false })
    : { data: [] };

  return (
    <div>
      <h2
        className="text-xl text-[#1E1B2E] mb-5"
        style={{ fontFamily: "'Playfair Display', serif" }}
      >
        Mis pedidos
      </h2>

      {!orders?.length ? (
        <div className="bg-white border border-[#E9DDE3] py-16 text-center">
          <Package size={40} className="mx-auto mb-4 text-[#D9C3CE]" />
          <p className="text-sm text-[#6E6680] mb-4">Aún no tienes pedidos.</p>
          <Link
            href="/catalogo"
            className="inline-block text-[11px] uppercase tracking-[0.15em] text-[#1E1B2E] border-b border-[#1E1B2E] pb-0.5"
          >
            Ir al catálogo
          </Link>
        </div>
      ) : (
        <div className="space-y-2.5">
          {orders.map((order: any) => {
            const s =
              STATUS_MAP[order.status] ?? {
                label: order.status,
                cls: "text-gray-500 bg-gray-50 border-gray-200",
              };
            return (
              <Link
                key={order.id}
                href={`/cuenta/pedidos/${order.id}`}
                className="block bg-white border border-[#E9DDE3] px-5 py-4 hover:border-[#A0647E] transition-colors group"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-[600] text-[#1E1B2E] group-hover:text-[#A0647E] transition-colors">
                      {order.order_number}
                    </p>
                    <p className="text-[11px] text-[#6E6680] mt-0.5">
                      {formatDate(order.created_at)} · {order.shipping_city},{" "}
                      {order.shipping_department}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`text-[10px] px-2.5 py-1 border font-[500] ${s.cls}`}>
                      {s.label}
                    </span>
                    <p className="text-sm font-[600] text-[#1E1B2E]">{formatCOP(order.total)}</p>
                    <ArrowRight
                      size={14}
                      className="text-[#D9C3CE] group-hover:text-[#6E6680] transition-colors"
                    />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
