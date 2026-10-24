"use client";

import { useState, useEffect } from "react";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { buildSku } from "@/lib/utils/sku";

export interface VariantRow {
  sku: string;
  attributes: { talla: string; color: string };
  stock: number;
  price: number | null;
}

interface Props {
  variants: VariantRow[];
  onChange: (variants: VariantRow[]) => void;
  basePrice: number;
  /** Nombre del producto: prefijo del SKU autogenerado. */
  productName: string;
}

const TALLAS_DEFAULT = ["XS", "S", "M", "L", "XL", "XXL"];

export function VariantManager({ variants, onChange, basePrice, productName }: Props) {
  const [tallas, setTallas] = useState<string[]>([]);
  const [colores, setColores] = useState<string[]>([]);
  const [newTalla, setNewTalla] = useState("");
  const [newColor, setNewColor] = useState("");

  // Sync tallas/colores from incoming variants (for edit mode)
  useEffect(() => {
    if (variants.length === 0) return;
    const t = [...new Set(variants.map((v) => v.attributes.talla))];
    const c = [...new Set(variants.map((v) => v.attributes.color))];
    setTallas(t);
    setColores(c);
  }, []); // only on mount

  function rebuildMatrix(nextTallas: string[], nextColores: string[]) {
    const next: VariantRow[] = [];
    for (const t of nextTallas) {
      for (const c of nextColores) {
        const existing = variants.find(
          (v) => v.attributes.talla === t && v.attributes.color === c
        );
        next.push(
          existing ?? {
            sku: buildSku(productName, t, c),
            attributes: { talla: t, color: c },
            stock: 0,
            price: null,
          }
        );
      }
    }
    onChange(next);
  }

  function addTalla(value: string) {
    const v = value.trim().toUpperCase();
    if (!v || tallas.includes(v)) return;
    const next = [...tallas, v];
    setTallas(next);
    rebuildMatrix(next, colores);
  }

  function removeTalla(t: string) {
    const next = tallas.filter((x) => x !== t);
    setTallas(next);
    rebuildMatrix(next, colores);
  }

  function addColor(value: string) {
    const v = value.trim();
    if (!v || colores.includes(v)) return;
    const next = [...colores, v];
    setColores(next);
    rebuildMatrix(tallas, next);
  }

  function removeColor(c: string) {
    const next = colores.filter((x) => x !== c);
    setColores(next);
    rebuildMatrix(tallas, next);
  }

  function updateVariant(
    talla: string,
    color: string,
    field: "sku" | "stock" | "price",
    value: string
  ) {
    const next = variants.map((v) => {
      if (v.attributes.talla !== talla || v.attributes.color !== color) return v;
      if (field === "sku") return { ...v, sku: value };
      if (field === "stock") return { ...v, stock: Math.max(0, parseInt(value) || 0) };
      if (field === "price")
        return { ...v, price: value === "" ? null : Math.max(0, parseFloat(value) || 0) };
      return v;
    });
    onChange(next);
  }

  function getVariant(talla: string, color: string): VariantRow | undefined {
    return variants.find(
      (v) => v.attributes.talla === talla && v.attributes.color === color
    );
  }

  const inputCls =
    "w-full border border-[#E8DED4] bg-white px-2 py-1 text-xs text-[#221A33] focus:outline-none focus:border-[#766A63]";

  return (
    <div className="space-y-5">
      {/* Tallas */}
      <div>
        <p className="text-[10px] tracking-[0.18em] uppercase text-[#766A63] font-[600] mb-2">
          Tallas disponibles
        </p>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {TALLAS_DEFAULT.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => (tallas.includes(t) ? removeTalla(t) : addTalla(t))}
              className={cn(
                "px-3 py-1 text-xs border transition-colors",
                tallas.includes(t)
                  ? "bg-[#221A33] text-[#F7F2EC] border-[#221A33]"
                  : "bg-white text-[#766A63] border-[#E8DED4] hover:border-[#766A63]"
              )}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={newTalla}
            onChange={(e) => setNewTalla(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); addTalla(newTalla); setNewTalla(""); }
            }}
            placeholder="Otra talla…"
            className="border border-[#E8DED4] px-2 py-1 text-xs text-[#221A33] focus:outline-none focus:border-[#766A63] w-32"
          />
          <button
            type="button"
            onClick={() => { addTalla(newTalla); setNewTalla(""); }}
            className="text-xs text-[#766A63] hover:text-[#221A33] flex items-center gap-1"
          >
            <Plus size={12} /> Agregar
          </button>
        </div>
      </div>

      {/* Colores */}
      <div>
        <p className="text-[10px] tracking-[0.18em] uppercase text-[#766A63] font-[600] mb-2">
          Colores disponibles
        </p>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {colores.map((c) => (
            <span
              key={c}
              className="flex items-center gap-1 px-2 py-0.5 text-xs bg-[#F7F2EC] text-[#221A33] border border-[#E8DED4]"
            >
              {c}
              <button type="button" onClick={() => removeColor(c)}>
                <X size={10} className="text-[#766A63] hover:text-[#A0526C]" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={newColor}
            onChange={(e) => setNewColor(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); addColor(newColor); setNewColor(""); }
            }}
            placeholder="Ej: Negro, Blanco, Rojo…"
            className="border border-[#E8DED4] px-2 py-1 text-xs text-[#221A33] focus:outline-none focus:border-[#766A63] w-48"
          />
          <button
            type="button"
            onClick={() => { addColor(newColor); setNewColor(""); }}
            className="text-xs text-[#766A63] hover:text-[#221A33] flex items-center gap-1"
          >
            <Plus size={12} /> Agregar
          </button>
        </div>
      </div>

      {/* Matriz talla × color */}
      {tallas.length > 0 && colores.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr>
                <th className="text-left text-[9px] tracking-[0.15em] uppercase text-[#766A63] font-[600] pb-2 pr-4 whitespace-nowrap">
                  Talla / Color
                </th>
                {colores.map((c) => (
                  <th
                    key={c}
                    className="text-center text-[9px] tracking-[0.15em] uppercase text-[#766A63] font-[600] pb-2 px-2 whitespace-nowrap"
                  >
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tallas.map((t) => (
                <tr key={t} className="border-t border-[#F7F2EC]">
                  <td className="py-2 pr-4 font-[500] text-[#221A33] whitespace-nowrap">{t}</td>
                  {colores.map((c) => {
                    const variant = getVariant(t, c);
                    if (!variant) return <td key={c} />;
                    return (
                      <td key={c} className="py-2 px-2 align-top">
                        <div className="space-y-1 min-w-[120px]">
                          {/* SKU */}
                          <input
                            value={variant.sku}
                            onChange={(e) => updateVariant(t, c, "sku", e.target.value)}
                            placeholder="SKU"
                            className={inputCls}
                            title="SKU"
                          />
                          {/* Stock */}
                          <div className="flex items-center gap-1">
                            <span className="text-[9px] text-[#766A63] w-10 shrink-0">Stock</span>
                            <input
                              type="number"
                              min={0}
                              value={variant.stock}
                              onChange={(e) => updateVariant(t, c, "stock", e.target.value)}
                              className={inputCls}
                            />
                          </div>
                          {/* Precio override */}
                          <div className="flex items-center gap-1">
                            <span className="text-[9px] text-[#766A63] w-10 shrink-0">Precio</span>
                            <input
                              type="number"
                              min={0}
                              step={100}
                              value={variant.price ?? ""}
                              onChange={(e) => updateVariant(t, c, "price", e.target.value)}
                              placeholder={String(basePrice)}
                              className={cn(inputCls, "placeholder:text-[#DCCFC4]")}
                              title="Dejar vacío para usar el precio base"
                            />
                          </div>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-[10px] text-[#766A63] mt-2">
            Precio vacío = usa el precio base del producto. SKU se genera automáticamente, puedes editarlo.
          </p>
        </div>
      )}

      {tallas.length === 0 && colores.length === 0 && (
        <p className="text-xs text-[#DCCFC4] italic">
          Agrega al menos una talla y un color para generar la matriz de variantes.
        </p>
      )}
    </div>
  );
}
