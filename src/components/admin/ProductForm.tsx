"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ImageUploader } from "./ImageUploader";
import { VariantManager, type VariantRow } from "./VariantManager";
import { cn } from "@/lib/utils/cn";
import { formatCOP, slugify } from "@/lib/utils/format";

interface TaxonomyItem {
  id: string;
  name: string;
  slug: string;
}

interface ProductFormData {
  id?: string;
  name: string;
  slug: string;
  description: string;
  care_instructions: string;
  base_price: string;
  compare_price: string;
  cost_price: string;
  status: "draft" | "active" | "archived";
  is_best_seller: boolean;
  is_pre_sale: boolean;
  images: string[];
  category_ids: string[];
  collection_ids: string[];
  occasion_ids: string[];
  variants: VariantRow[];
}

interface Props {
  initial?: Partial<ProductFormData>;
  categories: TaxonomyItem[];
  collections: TaxonomyItem[];
  occasions: TaxonomyItem[];
}

const EMPTY: ProductFormData = {
  name: "",
  slug: "",
  description: "",
  care_instructions: "",
  base_price: "",
  compare_price: "",
  cost_price: "",
  status: "draft",
  is_best_seller: false,
  is_pre_sale: false,
  images: [],
  category_ids: [],
  collection_ids: [],
  occasion_ids: [],
  variants: [],
};

export function ProductForm({ initial, categories, collections, occasions }: Props) {
  const router = useRouter();
  const isEdit = Boolean(initial?.id);
  const [form, setForm] = useState<ProductFormData>({ ...EMPTY, ...initial });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof ProductFormData>(key: K, value: ProductFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleNameChange(value: string) {
    setForm((prev) => ({
      ...prev,
      name: value,
      slug: prev.slug || slugify(value),
    }));
  }

  function toggleId(field: "category_ids" | "collection_ids" | "occasion_ids", id: string) {
    setForm((prev) => {
      const ids = prev[field];
      return {
        ...prev,
        [field]: ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id],
      };
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.name.trim()) { setError("El nombre es obligatorio."); return; }
    if (!form.base_price) { setError("El precio base es obligatorio."); return; }
    if (form.variants.length === 0) { setError("Agrega al menos una variante (talla + color)."); return; }

    const hasBadSku = form.variants.some((v) => !v.sku.trim());
    if (hasBadSku) { setError("Todas las variantes deben tener SKU."); return; }

    setSaving(true);
    try {
      const url = isEdit ? `/api/admin/products/${initial!.id}` : "/api/admin/products";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          slug: form.slug || slugify(form.name),
          base_price: parseFloat(form.base_price),
          compare_price: form.compare_price ? parseFloat(form.compare_price) : null,
          cost_price: form.cost_price ? parseFloat(form.cost_price) : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Error al guardar");
        return;
      }

      router.push("/admin/productos");
      router.refresh();
    } catch {
      setError("Error de red. Intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  const inputCls =
    "w-full border border-[#E8DED4] bg-white px-3 py-2 text-sm text-[#221A33] focus:outline-none focus:border-[#766A63] transition-colors placeholder:text-[#DCCFC4]";
  const labelCls =
    "block text-[10px] tracking-[0.18em] uppercase text-[#766A63] font-[600] mb-1.5";
  const sectionCls = "bg-white border border-[#E8DED4] p-5 space-y-4";

  return (
    <form onSubmit={handleSubmit} className="space-y-5 pb-20">

      {/* Información básica */}
      <div className={sectionCls}>
        <h2 className="text-sm font-[600] text-[#221A33] tracking-wide">Información básica</h2>

        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className={labelCls}>Nombre del producto *</label>
            <input
              value={form.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Ej: Vestido Lino Ibiza"
              required
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>Slug (URL)</label>
            <input
              value={form.slug}
              onChange={(e) => set("slug", e.target.value)}
              placeholder="se genera automáticamente"
              className={cn(inputCls, "font-mono text-xs")}
            />
            <p className="text-[10px] text-[#DCCFC4] mt-1">
              /producto/{form.slug || "vestido-lino-ibiza"}
            </p>
          </div>

          <div>
            <label className={labelCls}>Descripción</label>
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={4}
              placeholder="Describe el producto, materiales, corte, ajuste…"
              className={cn(inputCls, "resize-none")}
            />
          </div>

          <div>
            <label className={labelCls}>Cuidados del producto</label>
            <textarea
              value={form.care_instructions}
              onChange={(e) => set("care_instructions", e.target.value)}
              rows={2}
              placeholder="Ej: Lavar a mano en agua fría. No centrifugar."
              className={cn(inputCls, "resize-none")}
            />
          </div>
        </div>
      </div>

      {/* Precios */}
      <div className={sectionCls}>
        <h2 className="text-sm font-[600] text-[#221A33] tracking-wide">Precios</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Precio base (COP) *</label>
            <input
              type="number"
              min={0}
              step={100}
              value={form.base_price}
              onChange={(e) => set("base_price", e.target.value)}
              placeholder="120000"
              required
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Precio comparación (tachado)</label>
            <input
              type="number"
              min={0}
              step={100}
              value={form.compare_price}
              onChange={(e) => set("compare_price", e.target.value)}
              placeholder="150000"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Costo al por mayor (COP)</label>
            <input
              type="number"
              min={0}
              step={100}
              value={form.cost_price}
              onChange={(e) => set("cost_price", e.target.value)}
              placeholder="60000"
              className={inputCls}
            />
          </div>
          <div>
            <span className={labelCls}>Margen de ganancia</span>
            <MarginPreview price={form.base_price} cost={form.cost_price} />
          </div>
        </div>
        <p className="text-xs text-[#766A63]">
          El costo es privado: solo se ve en el panel admin y se usa para el inventario valorizado.
        </p>
      </div>

      {/* Estado */}
      <div className={sectionCls}>
        <h2 className="text-sm font-[600] text-[#221A33] tracking-wide">Estado</h2>
        <div className="flex gap-3 flex-wrap">
          {(["draft", "active", "archived"] as const).map((s) => (
            <label
              key={s}
              className={cn(
                "flex items-center gap-2 px-3 py-2 border text-xs cursor-pointer transition-colors",
                form.status === s
                  ? "border-[#221A33] bg-[#221A33] text-[#F7F2EC]"
                  : "border-[#E8DED4] text-[#766A63] hover:border-[#766A63]"
              )}
            >
              <input
                type="radio"
                name="status"
                value={s}
                checked={form.status === s}
                onChange={() => set("status", s)}
                className="hidden"
              />
              {s === "draft" ? "Borrador" : s === "active" ? "Activo" : "Archivado"}
            </label>
          ))}
        </div>

        {/* Best Seller toggle */}
        <label className="flex items-center gap-3 cursor-pointer pt-2">
          <div
            onClick={() => set("is_best_seller", !form.is_best_seller)}
            className={cn(
              "relative w-10 h-5 rounded-full transition-colors duration-200",
              form.is_best_seller ? "bg-[#766A63]" : "bg-[#E8DED4]"
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200",
                form.is_best_seller && "translate-x-5"
              )}
            />
          </div>
          <div>
            <p className="text-xs font-[600] text-[#221A33]">✦ Marcar como Best Seller</p>
            <p className="text-[10px] text-[#766A63]">Aparece en la sección Best Sellers del storefront</p>
          </div>
        </label>

        {/* Pre Venta toggle */}
        <label className="flex items-center gap-3 cursor-pointer">
          <div
            onClick={() => set("is_pre_sale", !form.is_pre_sale)}
            className={cn(
              "relative w-10 h-5 rounded-full transition-colors duration-200",
              form.is_pre_sale ? "bg-[#221A33]" : "bg-[#E8DED4]"
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200",
                form.is_pre_sale && "translate-x-5"
              )}
            />
          </div>
          <div>
            <p className="text-xs font-[600] text-[#221A33]">◈ Marcar como Pre Orden</p>
            <p className="text-[10px] text-[#766A63]">Muestra la etiqueta "PRE ORDEN" en la tarjeta del producto</p>
          </div>
        </label>
      </div>

      {/* Imágenes */}
      <div className={sectionCls}>
        <h2 className="text-sm font-[600] text-[#221A33] tracking-wide">Imágenes</h2>
        <ImageUploader images={form.images} onChange={(imgs) => set("images", imgs)} />
      </div>

      {/* Taxonomía */}
      <div className={sectionCls}>
        <h2 className="text-sm font-[600] text-[#221A33] tracking-wide">Categorías y colecciones</h2>
        <div className="grid grid-cols-1 gap-5">

          {categories.length > 0 && (
            <div>
              <label className={labelCls}>Categorías</label>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => toggleId("category_ids", cat.id)}
                    className={cn(
                      "px-3 py-1 text-xs border transition-colors",
                      form.category_ids.includes(cat.id)
                        ? "bg-[#221A33] text-[#F7F2EC] border-[#221A33]"
                        : "bg-white text-[#766A63] border-[#E8DED4] hover:border-[#766A63]"
                    )}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {collections.length > 0 && (
            <div>
              <label className={labelCls}>Colecciones</label>
              <div className="flex flex-wrap gap-2">
                {collections.map((col) => (
                  <button
                    key={col.id}
                    type="button"
                    onClick={() => toggleId("collection_ids", col.id)}
                    className={cn(
                      "px-3 py-1 text-xs border transition-colors",
                      form.collection_ids.includes(col.id)
                        ? "bg-[#A0526C] text-white border-[#A0526C]"
                        : "bg-white text-[#766A63] border-[#E8DED4] hover:border-[#A0526C]"
                    )}
                  >
                    {col.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {occasions.length > 0 && (
            <div>
              <label className={labelCls}>Ocasiones</label>
              <div className="flex flex-wrap gap-2">
                {occasions.map((occ) => (
                  <button
                    key={occ.id}
                    type="button"
                    onClick={() => toggleId("occasion_ids", occ.id)}
                    className={cn(
                      "px-3 py-1 text-xs border transition-colors",
                      form.occasion_ids.includes(occ.id)
                        ? "bg-[#766A63] text-white border-[#766A63]"
                        : "bg-white text-[#766A63] border-[#E8DED4] hover:border-[#766A63]"
                    )}
                  >
                    {occ.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {categories.length === 0 && collections.length === 0 && occasions.length === 0 && (
            <p className="text-xs text-[#DCCFC4] italic">
              No hay categorías ni colecciones creadas aún.
            </p>
          )}
        </div>
      </div>

      {/* Variantes */}
      <div className={sectionCls}>
        <h2 className="text-sm font-[600] text-[#221A33] tracking-wide">Variantes (talla × color)</h2>
        <VariantManager
          variants={form.variants}
          onChange={(v) => set("variants", v)}
          basePrice={parseFloat(form.base_price) || 0}
          productName={form.name}
        />
      </div>

      {/* Error global */}
      {error && (
        <p className="text-xs text-[#A0526C] border border-[#A0526C]/30 bg-[#F5DDE5]/20 px-4 py-2.5">
          {error}
        </p>
      )}

      {/* Acciones */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="text-xs text-[#766A63] hover:text-[#221A33] transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={saving}
          className={cn(
            "text-[11px] tracking-[0.18em] uppercase font-[600] px-8 py-3 transition-colors",
            saving
              ? "bg-[#DCCFC4] text-white cursor-not-allowed"
              : "bg-[#221A33] text-[#F7F2EC] hover:bg-[#A0526C]"
          )}
        >
          {saving ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear producto"}
        </button>
      </div>
    </form>
  );
}

/** Margen sobre el precio de venta, calculado mientras se escribe. */
function MarginPreview({ price, cost }: { price: string; cost: string }) {
  const p = parseFloat(price);
  const c = parseFloat(cost);

  if (!(p > 0) || !(c >= 0) || cost === "") {
    return <p className="py-2 text-sm text-[#DCCFC4]">Ingresa precio y costo</p>;
  }

  const profit = p - c;
  return (
    <p className={cn("py-2 text-sm font-[600]", profit < 0 ? "text-red-500" : "text-green-700")}>
      {formatCOP(profit)} · {((profit / p) * 100).toFixed(1)}%
    </p>
  );
}
