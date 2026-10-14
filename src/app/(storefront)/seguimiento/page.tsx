import type { Metadata } from "next";
import Link from "next/link";
import { Search, Package, MapPin, Truck, CheckCircle, XCircle, Clock } from "lucide-react";
import { createServiceClient } from "@/lib/supabase/server";
import { formatCOP, formatDate } from "@/lib/utils/format";
import { brand } from "@/lib/config/brand";

export const metadata: Metadata = { title: "Seguimiento de pedido" };

const STATUS_STEPS = [
  { key: "pending_payment", label: "Pendiente de pago", icon: Clock },
  { key: "paid", label: "Pago confirmado", icon: CheckCircle },
  { key: "preparing", label: "En preparación", icon: Package },
  { key: "shipped", label: "En camino", icon: Truck },
  { key: "delivered", label: "Entregado", icon: CheckCircle },
];

const STATUS_ORDER = ["pending_payment", "paid", "preparing", "shipped", "delivered"];

function getStepIndex(status: string) {
  return STATUS_ORDER.indexOf(status);
}

interface Props {
  searchParams: Promise<{ orden?: string; email?: string }>;
}

export default async function SeguimientoPage({ searchParams }: Props) {
  const { orden, email } = await searchParams;

  let order: any = null;
  let error: string | null = null;

  if (orden && email) {
    // Service client para que guests y clientes registrados puedan consultar
    const db = createServiceClient();
    const { data, error: err } = await db
      .from("orders")
      .select(`*, order_items (id, product_name, variant_attrs, quantity, total_price)`)
      .eq("order_number", orden.toUpperCase())
      .ilike("shipping_email", email.trim())
      .single();

    if (err || !data) {
      error = "No encontramos un pedido con ese número y correo. Verifica los datos.";
    } else {
      order = data;
    }
  }

  const isCancelled = order?.status === "cancelled";
  const currentStep = order ? getStepIndex(order.status) : -1;

  return (
    <div className="min-h-screen bg-[#FAF6F7]">
      <div className="max-w-2xl mx-auto px-4 py-12 sm:py-16">
        {/* Header */}
        <div className="text-center mb-10">
          <span className="text-[10px] tracking-[0.28em] uppercase text-[#A0647E] font-[500]">
            Estado de tu compra
          </span>
          <h1
            className="text-4xl text-[#1E1B2E] mt-2"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Seguimiento de pedido
          </h1>
        </div>

        {/* Formulario de búsqueda */}
        <form method="GET" className="bg-white border border-[#E9DDE3] p-6 mb-8">
          <p className="text-[11px] uppercase tracking-[0.15em] font-[600] text-[#1E1B2E] mb-4">
            Consultar pedido
          </p>
          <div className="space-y-3">
            <div>
              <label className="block text-[10px] uppercase tracking-[0.15em] text-[#6E6680] font-[600] mb-1.5">
                Número de pedido
              </label>
              <input
                name="orden"
                defaultValue={orden ?? ""}
                placeholder="MB-WEB001"
                className="w-full border border-[#E9DDE3] bg-white px-3 py-2.5 text-sm text-[#1E1B2E] focus:outline-none focus:border-[#6E6680] transition-colors placeholder:text-[#D9C3CE] uppercase"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-[0.15em] text-[#6E6680] font-[600] mb-1.5">
                Correo electrónico
              </label>
              <input
                name="email"
                type="email"
                defaultValue={email ?? ""}
                placeholder="tu@correo.com"
                className="w-full border border-[#E9DDE3] bg-white px-3 py-2.5 text-sm text-[#1E1B2E] focus:outline-none focus:border-[#6E6680] transition-colors placeholder:text-[#D9C3CE]"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-3 bg-[#1E1B2E] text-[#FAF6F7] text-[11px] tracking-[0.2em] uppercase font-[500] hover:bg-[#A0647E] transition-colors rounded-full"
            >
              <Search size={14} /> Buscar pedido
            </button>
          </div>
        </form>

        {/* Error */}
        {error && (
          <div className="bg-white border border-[#F2D4DC] p-4 mb-6 flex items-start gap-3">
            <XCircle size={18} className="text-[#A0647E] shrink-0 mt-0.5" />
            <p className="text-sm text-[#6E6680]">{error}</p>
          </div>
        )}

        {/* Resultado */}
        {order && (
          <div className="space-y-5">
            {/* Cabecera del pedido */}
            <div className="bg-white border border-[#E9DDE3] p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.15em] text-[#A0647E] font-[500]">
                    Pedido
                  </p>
                  <p
                    className="text-2xl text-[#1E1B2E] mt-0.5"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {order.order_number}
                  </p>
                  <p className="text-xs text-[#6E6680] mt-1">{formatDate(order.created_at)}</p>
                </div>
                <p className="text-xl font-[600] text-[#1E1B2E]">{formatCOP(order.total)}</p>
              </div>
            </div>

            {/* Timeline de estado */}
            <div className="bg-white border border-[#E9DDE3] p-5">
              <p className="text-[11px] uppercase tracking-[0.15em] font-[600] text-[#1E1B2E] mb-5">
                Estado del pedido
              </p>

              {isCancelled ? (
                <div className="flex items-center gap-3 py-3 text-[#A0647E]">
                  <XCircle size={20} />
                  <div>
                    <p className="text-sm font-[600]">Pedido cancelado</p>
                    <p className="text-xs text-[#6E6680] mt-0.5">
                      Este pedido fue cancelado. Si tienes preguntas escríbenos a {brand.email}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-0">
                  {STATUS_STEPS.map((step, idx) => {
                    const done = currentStep >= idx;
                    const active = currentStep === idx;
                    return (
                      <div key={step.key} className="flex items-start gap-4">
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                              done
                                ? "bg-[#1E1B2E] text-[#FAF6F7]"
                                : "bg-[#FAF6F7] text-[#D9C3CE] border border-[#E9DDE3]"
                            }`}
                          >
                            <step.icon size={14} />
                          </div>
                          {idx < STATUS_STEPS.length - 1 && (
                            <div className={`w-px h-6 ${done ? "bg-[#1E1B2E]" : "bg-[#E9DDE3]"}`} />
                          )}
                        </div>
                        <div className="pb-4">
                          <p
                            className={`text-sm ${active ? "font-[600]" : "font-[400]"} ${
                              done ? "text-[#1E1B2E]" : "text-[#D9C3CE]"
                            }`}
                          >
                            {step.label}
                          </p>
                          {active && step.key === "shipped" && order.tracking_number && (
                            <p className="text-xs text-[#6E6680] mt-0.5">
                              Guía: <span className="font-[600] text-[#1E1B2E]">{order.tracking_number}</span>
                              {order.courier && ` · ${order.courier}`}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Prendas */}
            <div className="bg-white border border-[#E9DDE3]">
              <div className="flex items-center gap-2 px-5 py-3 border-b border-[#FAF6F7]">
                <Package size={13} className="text-[#A0647E]" />
                <p className="text-[11px] uppercase tracking-[0.15em] font-[600] text-[#1E1B2E]">
                  Prendas
                </p>
              </div>
              {order.order_items?.map((item: any) => {
                const attrs = Object.values(item.variant_attrs ?? {}).filter(Boolean).join(" · ");
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between px-5 py-3.5 border-b border-[#FAF6F7] last:border-0"
                  >
                    <div>
                      <p className="text-sm text-[#1E1B2E] font-[500]">{item.product_name}</p>
                      {attrs && <p className="text-[11px] text-[#6E6680]">{attrs}</p>}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-[600] text-[#1E1B2E]">{formatCOP(item.total_price)}</p>
                      <p className="text-[11px] text-[#6E6680]">× {item.quantity}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Envío */}
            <div className="bg-white border border-[#E9DDE3]">
              <div className="flex items-center gap-2 px-5 py-3 border-b border-[#FAF6F7]">
                <MapPin size={13} className="text-[#A0647E]" />
                <p className="text-[11px] uppercase tracking-[0.15em] font-[600] text-[#1E1B2E]">
                  Dirección de envío
                </p>
              </div>
              <div className="px-5 py-4 text-sm text-[#6E6680] space-y-0.5">
                <p className="text-[#1E1B2E] font-[500]">{order.shipping_name}</p>
                <p>{order.shipping_address}</p>
                <p>{order.shipping_city}, {order.shipping_department}</p>
              </div>
            </div>

            <p className="text-center text-xs text-[#6E6680]">
              ¿Tienes dudas?{" "}
              <Link href={`mailto:${brand.email}`} className="text-[#1E1B2E] underline underline-offset-2">
                {brand.email}
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
