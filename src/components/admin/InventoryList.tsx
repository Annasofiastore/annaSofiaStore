"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { formatCOP } from "@/lib/utils/format";
import { ProductThumb } from "@/components/admin/ProductThumb";
import { StockAdjuster } from "@/components/admin/StockAdjuster";

export interface InventoryRow {
  id: string;
  sku: string;
  stock: number;
  reserved: number;
  attributes: Record<string, string> | null;
  productId: string | null;
  /** Precio de venta efectivo (precio de la variante o, si no tiene, el base). */
  price: number;
  /** Costo al por mayor; null si aún no se ha registrado. */
  cost: number | null;
  productName: string;
  image?: string;
}

const ESTADOS = [
  { value: "todos", label: "Todos" },
  { value: "disponibles", label: "Disponibles" },
  { value: "agotados", label: "Agotados" },
  { value: "bajo", label: "Stock bajo" },
  { value: "ok", label: "En stock" },
] as const;

type Estado = (typeof ESTADOS)[number]["value"];

/** Minúsculas y sin tildes: buscar "vestido rojo" debe encontrar "Vestido Rojó". */
function norm(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

/** Margen sobre el precio de venta. */
function marginPct(price: number, cost: number) {
  return price > 0 ? ((price - cost) / price) * 100 : 0;
}

function attrsText(attributes: Record<string, string> | null) {
  return Object.entries(attributes ?? {})
    .map(([k, v]) => `${k}: ${v}`)
    .join(" · ");
}

export function InventoryList({ rows, truncated }: { rows: InventoryRow[]; truncated: boolean }) {
  const [query, setQuery] = useState("");
  const [estado, setEstado] = useState<Estado>("todos");
  const [soloSinCosto, setSoloSinCosto] = useState(false);

  // El índice de búsqueda se calcula una vez por lista, no en cada tecla.
  const indexed = useMemo(
    () =>
      rows.map((r) => ({
        ...r,
        available: Math.max(0, r.stock - r.reserved),
        haystack: norm(`${r.productName} ${r.sku} ${attrsText(r.attributes)}`),
      })),
    [rows]
  );

  const counts = useMemo(
    () => ({
      todos: indexed.length,
      disponibles: indexed.filter((v) => v.available > 0).length,
      agotados: indexed.filter((v) => v.available === 0).length,
      bajo: indexed.filter((v) => v.available > 0 && v.available <= 3).length,
      ok: indexed.filter((v) => v.available > 3).length,
    }),
    [indexed]
  );

  const visible = useMemo(() => {
    // Cada palabra debe aparecer en algún campo: "vestido m" filtra por ambas.
    const terms = norm(query).split(/\s+/).filter(Boolean);

    return indexed.filter((v) => {
      if (estado === "disponibles" && v.available === 0) return false;
      if (estado === "agotados" && v.available !== 0) return false;
      if (estado === "bajo" && !(v.available > 0 && v.available <= 3)) return false;
      if (estado === "ok" && v.available <= 3) return false;
      if (soloSinCosto && v.cost !== null) return false;
      return terms.every((t) => v.haystack.includes(t));
    });
  }, [indexed, query, estado, soloSinCosto]);

  // Se valoriza el stock físico (incluye lo reservado en pedidos sin pagar: sigue
  // siendo mercancía de la tienda). Sigue a los filtros para poder valorizar,
  // por ejemplo, solo lo que coincide con una búsqueda.
  const totals = useMemo(() => {
    let units = 0;
    let saleValue = 0;
    let costValue = 0;
    let costedSale = 0;
    let missingCost = 0;

    for (const v of visible) {
      units += v.stock;
      saleValue += v.stock * v.price;
      if (v.cost === null) {
        missingCost++;
      } else {
        costValue += v.stock * v.cost;
        costedSale += v.stock * v.price;
      }
    }

    const profit = costedSale - costValue;
    return {
      units,
      saleValue,
      costValue,
      profit,
      margin: costedSale > 0 ? (profit / costedSale) * 100 : 0,
      missingCost,
    };
  }, [visible]);

  const filtered = query !== "" || estado !== "todos" || soloSinCosto;

  const tone = (available: number) =>
    available === 0 ? "text-red-500" : available <= 3 ? "text-[#A0526C]" : "text-green-700";

  return (
    <div>
      <p className="text-sm text-[#766A63] mb-5">
        {counts.agotados} agotados · {counts.bajo} con stock bajo · {counts.ok} OK
      </p>

      {/* Inventario valorizado */}
      <section className="bg-white border border-[#E8DED4] p-4 mb-5">
        <div className="flex items-baseline justify-between gap-3 mb-3">
          <h2 className="text-sm font-[600] text-[#1C1B2E] tracking-wide">Inventario valorizado</h2>
          <span className="text-[10px] tracking-[0.15em] uppercase text-[#766A63]">
            {filtered ? `Filtrado · ${visible.length} variantes` : "Todo el inventario"}
          </span>
        </div>

        <dl className="grid grid-cols-2 md:grid-cols-5 gap-x-4 gap-y-3">
          {[
            { label: "Unidades", value: totals.units.toLocaleString("es-CO") },
            { label: "Valor al costo", value: formatCOP(totals.costValue) },
            { label: "Valor de venta", value: formatCOP(totals.saleValue) },
            { label: "Ganancia potencial", value: formatCOP(totals.profit) },
            { label: "Margen", value: `${totals.margin.toFixed(1)}%` },
          ].map((k) => (
            <div key={k.label}>
              <dt className="text-[9px] tracking-[0.2em] uppercase text-[#766A63]">{k.label}</dt>
              <dd className="text-lg font-[600] text-[#1C1B2E]">{k.value}</dd>
            </div>
          ))}
        </dl>

        {(totals.missingCost > 0 || soloSinCosto) && (
          <p className="mt-3 text-xs text-[#766A63]">
            {totals.missingCost} variantes sin costo registrado no entran en el valor al costo, la
            ganancia ni el margen.{" "}
            <button
              type="button"
              onClick={() => setSoloSinCosto((x) => !x)}
              className="underline text-[#1C1B2E]"
            >
              {soloSinCosto ? "Ver todas" : "Ver solo sin costo"}
            </button>
          </p>
        )}
      </section>

      {/* Búsqueda instantánea: filtra mientras se escribe, sin recargar */}
      <div className="relative mb-4">
        <Search
          size={16}
          strokeWidth={1.5}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[#766A63] pointer-events-none"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por producto, SKU, talla o color"
          autoComplete="off"
          aria-label="Buscar en el inventario"
          className="h-11 w-full border border-[#E8DED4] bg-white pl-9 pr-11 text-sm text-[#1C1B2E] placeholder:text-[#766A63]"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Limpiar búsqueda"
            className="absolute right-0 top-0 h-11 w-11 flex items-center justify-center text-[#766A63]"
          >
            <X size={16} strokeWidth={1.5} />
          </button>
        )}
      </div>

      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {ESTADOS.map((e) => (
          <button
            key={e.value}
            type="button"
            onClick={() => setEstado(e.value)}
            className={cn(
              "shrink-0 h-9 px-3 flex items-center border text-[10px] tracking-[0.15em] uppercase",
              estado === e.value
                ? "bg-[#1C1B2E] border-[#1C1B2E] text-[#F7F2EC]"
                : "bg-white border-[#E8DED4] text-[#766A63]"
            )}
          >
            {e.label} ({counts[e.value]})
          </button>
        ))}
      </div>

      {truncated && (
        <p className="mb-4 text-xs text-[#766A63] border border-[#E8DED4] bg-white px-3 py-2">
          Mostrando las primeras {rows.length} variantes ordenadas por menor stock. Si no
          encuentras una, refina la búsqueda desde Productos.
        </p>
      )}

      {visible.length === 0 ? (
        <p className="text-sm text-[#766A63] py-8 text-center border border-[#E8DED4] bg-white">
          {query ? `Sin resultados para "${query}".` : "No hay variantes en este estado."}
        </p>
      ) : (
        <>
          {/* Celular: una tarjeta por variante, sin scroll horizontal */}
          <div className="md:hidden space-y-3">
            {visible.map((v) => (
              <div key={v.id} className="bg-white border border-[#E8DED4] p-3">
                <div className="flex gap-3">
                  <ProductThumb src={v.image} alt={v.productName} size="md" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[#1C1B2E] leading-tight">{v.productName}</p>
                    <p className="text-xs text-[#766A63] mt-0.5">{attrsText(v.attributes)}</p>
                    <p className="font-mono text-[10px] text-[#766A63] mt-0.5 truncate">{v.sku}</p>
                    <p className="mt-1.5">
                      <span className="text-[9px] tracking-[0.2em] uppercase text-[#766A63] mr-2">
                        Disponible
                      </span>
                      <span className={cn("text-lg font-[600]", tone(v.available))}>
                        {v.available}
                      </span>
                    </p>
                    <p className="mt-1 text-xs text-[#766A63]">
                      Venta {formatCOP(v.price)} ·{" "}
                      {v.cost === null ? (
                        <MissingCost productId={v.productId} />
                      ) : (
                        <>
                          Costo {formatCOP(v.cost)} · <Margin price={v.price} cost={v.cost} />
                        </>
                      )}
                    </p>
                  </div>
                </div>

                <div className="mt-3">
                  <StockAdjuster variantId={v.id} stock={v.stock} reserved={v.reserved} />
                </div>
              </div>
            ))}
          </div>

          {/* Escritorio: tabla */}
          <div className="hidden md:block bg-white border border-[#E8DED4] overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E8DED4]">
                  {["", "Producto", "Atributos", "SKU", "Costo", "Precio venta", "Margen", "Disponible", "Ajustar stock"].map((h, i) => (
                    <th
                      key={i}
                      className="text-left text-[9px] tracking-[0.2em] uppercase text-[#766A63] font-[600] px-4 py-2"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visible.map((v) => (
                  <tr key={v.id} className="border-b border-[#F7F2EC] align-top">
                    <td className="pl-4 py-3">
                      <ProductThumb src={v.image} alt={v.productName} />
                    </td>
                    <td className="px-4 py-3 text-[#1C1B2E]">{v.productName}</td>
                    <td className="px-4 py-3 text-xs text-[#766A63]">{attrsText(v.attributes)}</td>
                    <td className="px-4 py-3 font-mono text-xs text-[#766A63]">{v.sku}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-[#1C1B2E]">
                      {v.cost === null ? <MissingCost productId={v.productId} /> : formatCOP(v.cost)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-[#1C1B2E]">{formatCOP(v.price)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {v.cost === null ? "—" : <Margin price={v.price} cost={v.cost} />}
                    </td>
                    <td className={cn("px-4 py-3 font-[600]", tone(v.available))}>{v.available}</td>
                    <td className="px-4 py-3">
                      <StockAdjuster variantId={v.id} stock={v.stock} reserved={v.reserved} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function Margin({ price, cost }: { price: number; cost: number }) {
  const profit = price - cost;
  return (
    <span className={cn("font-[600]", profit < 0 ? "text-red-500" : "text-green-700")}>
      {formatCOP(profit)} ({marginPct(price, cost).toFixed(1)}%)
    </span>
  );
}

function MissingCost({ productId }: { productId: string | null }) {
  if (!productId) return <span className="text-[#A0526C]">Sin costo</span>;
  return (
    <Link href={`/admin/productos/${productId}`} className="text-[#A0526C] underline">
      Sin costo
    </Link>
  );
}
