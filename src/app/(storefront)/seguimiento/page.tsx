import type { Metadata } from "next";
import Link from "next/link";
import { Search, Package, MapPin, Truck, CheckCircle, XCircle, Clock } from "lucide-react";
import { createServiceClient } from "@/lib/supabase/server";
import { formatCOP, formatDate } from "@/lib/utils/format";
import { brand } from "@/lib/config/brand";
import { cookies } from "next/headers";
import { lookupOrder } from "./actions";

export const metadata: Metadata = { title: "Seguimiento de pedido", robots: { index: false, follow: false } };

const STATUS_STEPS = [
  { key: "pending_payment", label: "Pendiente de pago", icon: Clock },
  { key: "paid", label: "Pago confirmado", icon: CheckCircle },
  { key: "preparing", label: "En preparación", icon: Package },
  { key: "shipped", label: "En camino", icon: Truck },
  { key: "delivered", label: "Entregado", icon: CheckCircle },
];

// Contraentrega: no hay "pago confirmado" antes de enviar; el pago se recibe al entregar
const CONTRAENTREGA_STEPS = [
  { key: "pending_payment", label: "Pedido recibido", icon: CheckCircle },
  { key: "preparing", label: "En preparación", icon: Package },
  { key: "shipped", label: "En camino", icon: Truck },
  { key: "delivered", label: "Entregado y pagado", icon: CheckCircle },
];

function getStepIndex(steps: { key: string }[], status: string) {
  // Un pedido contraentrega antiguo puede estar en "paid": equivale a "pedido recibido"
  const key = status === "paid" && steps === CONTRAENTREGA_STEPS ? "pending_payment" : status;
  return steps.findIndex((step) => step.key === key);
}

interface Props {
  searchParams: Promise<{ orden?: string; email?: string }>;
}

// Consulta guardada por la acción del formulario (ver actions.ts)
function readSavedLookup(raw: string | undefined): { orden?: string; email?: string } {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(Buffer.from(raw, "base64url").toString());
    return {
      orden: typeof parsed.orden === "string" ? parsed.orden : undefined,
      email: typeof parsed.email === "string" ? parsed.email : undefined,
    };
  } catch {
    return {};
  }
}

export default async function SeguimientoPage({ searchParams }: Props) {
  const query = await searchParams;
  const saved = readSavedLookup((await cookies()).get("seguimiento")?.value);
  // El número puede venir en el enlace de los correos; el correo solo por el formulario (cookie).
  // ?email= se sigue aceptando únicamente para enlaces antiguos ya enviados.
  const orden = query.orden ?? saved.orden;
  const email = query.email ?? saved.email;

  let order: any = null;
  let error: string | null = null;

  if (orden && email) {
    // Service client para que guests y clientes registrados puedan consultar
    const db = createServiceClient();
    const { data } = await db
      .from("orders")
      .select(`*, order_items (id, product_name, variant_attrs, quantity, total_price)`)
      .eq("order_number", orden.trim().toUpperCase())
      .maybeSingle();

    // Comparación exacta del correo (sin comodines): con ilike, "%" coincidía con cualquier correo
    const emailMatches =
      !!data && (data.shipping_email ?? "").trim().toLowerCase() === email.trim().toLowerCase();

    if (!data || !emailMatches) {
      error = "No encontramos un pedido con ese número y correo. Verifica los datos.";
    } else {
      order = data;
    }
  }

  const isCancelled = order?.status === "cancelled";
  const steps = order?.payment_method === "contraentrega" ? CONTRAENTREGA_STEPS : STATUS_STEPS;
  const currentStep = order ? getStepIndex(steps, order.status) : -1;

  return (
    <div className="min-h-screen bg-[#F7F2EC]">
      <div className="max-w-2xl mx-auto px-4 py-12 sm:py-16">
        {/* Header */}
        <div className="text-center mb-10">
          <span className="text-[10px] tracking-[0.28em] uppercase text-[#A0526C] font-[500]">
            Estado de tu compra
          </span>
          <h1
            className="text-4xl text-[#221A33] mt-2"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Seguimiento de pedido
          </h1>
        </div>

        {/* Formulario de búsqueda */}
        <form action={lookupOrder} className="bg-white border border-[#E8DED4] p-6 mb-8">
          <p className="text-[11px] uppercase tracking-[0.15em] font-[600] text-[#221A33] mb-4">
            Consultar pedido
          </p>
          <div className="space-y-3">
            <div>
              <label className="block text-[10px] uppercase tracking-[0.15em] text-[#766A63] font-[600] mb-1.5">
                Número de pedido
              </label>
              <input
                name="orden"
                defaultValue={orden ?? ""}
                placeholder="AS-WEB001"
                className="w-full border border-[#E8DED4] bg-white px-3 py-2.5 text-sm text-[#221A33] focus:outline-none focus:border-[#766A63] transition-colors placeholder:text-[#DCCFC4] uppercase"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-[0.15em] text-[#766A63] font-[600] mb-1.5">
                Correo electrónico
              </label>
              <input
                name="email"
                type="email"
                defaultValue={email ?? ""}
                placeholder="tu@correo.com"
                className="w-full border border-[#E8DED4] bg-white px-3 py-2.5 text-sm text-[#221A33] focus:outline-none focus:border-[#766A63] transition-colors placeholder:text-[#DCCFC4]"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-3 bg-[#221A33] text-[#F7F2EC] text-[11px] tracking-[0.2em] uppercase font-[500] hover:bg-[#A0526C] transition-colors rounded-full"
            >
              <Search size={14} /> Buscar pedido
            </button>
          </div>
        </form>

        {/* Error */}
        {error && (
          <div className="bg-white border border-[#F5DDE5] p-4 mb-6 flex items-start gap-3">
            <XCircle size={18} className="text-[#A0526C] shrink-0 mt-0.5" />
            <p className="text-sm text-[#766A63]">{error}</p>
          </div>
        )}

        {/* Resultado */}
        {order && (
          <div className="space-y-5">
            {/* Cabecera del pedido */}
            <div className="bg-white border border-[#E8DED4] p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.15em] text-[#A0526C] font-[500]">
                    Pedido
                  </p>
                  <p
                    className="text-2xl text-[#221A33] mt-0.5"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {order.order_number}
                  </p>
                  <p className="text-xs text-[#766A63] mt-1">{formatDate(order.created_at)}</p>
                </div>
                <p className="text-xl font-[600] text-[#221A33]">{formatCOP(order.total)}</p>
              </div>
            </div>

            {/* Timeline de estado */}
            <div className="bg-white border border-[#E8DED4] p-5">
              <p className="text-[11px] uppercase tracking-[0.15em] font-[600] text-[#221A33] mb-5">
                Estado del pedido
              </p>

              {isCancelled ? (
                <div className="flex items-center gap-3 py-3 text-[#A0526C]">
                  <XCircle size={20} />
                  <div>
                    <p className="text-sm font-[600]">Pedido cancelado</p>
                    <p className="text-xs text-[#766A63] mt-0.5">
                      Este pedido fue cancelado. Si tienes preguntas escríbenos a {brand.email}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-0">
                  {steps.map((step, idx) => {
                    const done = currentStep >= idx;
                    const active = currentStep === idx;
                    return (
                      <div key={step.key} className="flex items-start gap-4">
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                              done
                                ? "bg-[#221A33] text-[#F7F2EC]"
                                : "bg-[#F7F2EC] text-[#DCCFC4] border border-[#E8DED4]"
                            }`}
                          >
                            <step.icon size={14} />
                          </div>
                          {idx < steps.length - 1 && (
                            <div className={`w-px h-6 ${done ? "bg-[#221A33]" : "bg-[#E8DED4]"}`} />
                          )}
                        </div>
                        <div className="pb-4">
                          <p
                            className={`text-sm ${active ? "font-[600]" : "font-[400]"} ${
                              done ? "text-[#221A33]" : "text-[#DCCFC4]"
                            }`}
                          >
                            {step.label}
                          </p>
                          {active && step.key === "shipped" && order.tracking_number && (
                            <p className="text-xs text-[#766A63] mt-0.5">
                              Guía: <span className="font-[600] text-[#221A33]">{order.tracking_number}</span>
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
            <div className="bg-white border border-[#E8DED4]">
              <div className="flex items-center gap-2 px-5 py-3 border-b border-[#F7F2EC]">
                <Package size={13} className="text-[#A0526C]" />
                <p className="text-[11px] uppercase tracking-[0.15em] font-[600] text-[#221A33]">
                  Prendas
                </p>
              </div>
              {order.order_items?.map((item: any) => {
                const attrs = Object.values(item.variant_attrs ?? {}).filter(Boolean).join(" · ");
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between px-5 py-3.5 border-b border-[#F7F2EC] last:border-0"
                  >
                    <div>
                      <p className="text-sm text-[#221A33] font-[500]">{item.product_name}</p>
                      {attrs && <p className="text-[11px] text-[#766A63]">{attrs}</p>}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-[600] text-[#221A33]">{formatCOP(item.total_price)}</p>
                      <p className="text-[11px] text-[#766A63]">× {item.quantity}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Envío */}
            <div className="bg-white border border-[#E8DED4]">
              <div className="flex items-center gap-2 px-5 py-3 border-b border-[#F7F2EC]">
                <MapPin size={13} className="text-[#A0526C]" />
                <p className="text-[11px] uppercase tracking-[0.15em] font-[600] text-[#221A33]">
                  Dirección de envío
                </p>
              </div>
              <div className="px-5 py-4 text-sm text-[#766A63] space-y-0.5">
                <p className="text-[#221A33] font-[500]">{order.shipping_name}</p>
                <p>{order.shipping_address}</p>
                <p>{order.shipping_city}, {order.shipping_department}</p>
              </div>
            </div>

            <p className="text-center text-xs text-[#766A63]">
              ¿Tienes dudas?{" "}
              <Link href={`mailto:${brand.email}`} className="text-[#221A33] underline underline-offset-2">
                {brand.email}
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
