"use client";

import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Tag, Percent, DollarSign } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatCOP, formatDateShort } from "@/lib/utils/format";

type Promo = {
  id: string;
  name: string;
  code: string | null;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  scope: string;
  max_uses: number | null;
  used_count: number;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
  is_cumulative: boolean;
};

const EMPTY: Omit<Promo, "id" | "used_count"> = {
  name: "",
  code: "",
  discount_type: "percentage",
  discount_value: 10,
  scope: "global",
  max_uses: null,
  starts_at: new Date().toISOString().slice(0, 16),
  ends_at: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().slice(0, 16),
  is_active: true,
  is_cumulative: false,
};

const INPUT = "w-full border border-[#e5e7eb] bg-white px-3 py-2 text-sm focus:outline-none focus:border-[#766A63] transition-colors placeholder:text-gray-300";
const LABEL = "block text-xs font-[500] text-gray-500 mb-1";

function promoStatus(p: Promo): { label: string; cls: string } {
  const now = new Date();
  if (!p.is_active) return { label: "Inactivo", cls: "text-gray-500 bg-gray-100" };
  if (new Date(p.ends_at) < now) return { label: "Expirado", cls: "text-red-600 bg-red-50" };
  if (new Date(p.starts_at) > now) return { label: "Programado", cls: "text-blue-600 bg-blue-50" };
  if (p.max_uses && p.used_count >= p.max_uses)
    return { label: "Agotado", cls: "text-orange-600 bg-orange-50" };
  return { label: "Activo", cls: "text-green-700 bg-green-50" };
}

export default function AdminDescuentosPage() {
  const [promos, setPromos] = useState<Promo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<Promo, "id" | "used_count">>(EMPTY);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  async function load() {
    const { data } = await supabase
      .from("promotions")
      .select("*")
      .order("created_at", { ascending: false });
    setPromos(data ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openNew() {
    setForm(EMPTY);
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(p: Promo) {
    setForm({
      name: p.name,
      code: p.code ?? "",
      discount_type: p.discount_type,
      discount_value: p.discount_value,
      scope: p.scope,
      max_uses: p.max_uses,
      starts_at: p.starts_at.slice(0, 16),
      ends_at: p.ends_at.slice(0, 16),
      is_active: p.is_active,
      is_cumulative: p.is_cumulative,
    });
    setEditingId(p.id);
    setShowForm(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      code: form.code?.trim() || null,
      starts_at: new Date(form.starts_at).toISOString(),
      ends_at: new Date(form.ends_at).toISOString(),
    };
    if (editingId) {
      await supabase.from("promotions").update(payload).eq("id", editingId);
    } else {
      await supabase.from("promotions").insert(payload);
    }
    await load();
    setShowForm(false);
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este descuento?")) return;
    await supabase.from("promotions").delete().eq("id", id);
    setPromos((prev) => prev.filter((p) => p.id !== id));
  }

  async function toggleActive(p: Promo) {
    await supabase.from("promotions").update({ is_active: !p.is_active }).eq("id", p.id);
    setPromos((prev) =>
      prev.map((x) => (x.id === p.id ? { ...x, is_active: !x.is_active } : x))
    );
  }

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-800">Descuentos y Cupones</h1>
        <button
          onClick={openNew}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#221A33] text-white text-xs rounded hover:bg-[#352A4B] transition-colors"
        >
          <Plus size={14} /> Nuevo descuento
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded p-5 mb-6">
          <p className="text-sm font-[600] text-gray-800 mb-4">
            {editingId ? "Editar descuento" : "Nuevo descuento"}
          </p>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL}>Nombre interno *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ej: Descuento verano 20%"
                  className={INPUT}
                  required
                />
              </div>
              <div>
                <label className={LABEL}>Código de cupón</label>
                <input
                  value={form.code ?? ""}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  placeholder="VERANO20 (vacío = sin código)"
                  className={`${INPUT} uppercase`}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={LABEL}>Tipo de descuento</label>
                <select
                  value={form.discount_type}
                  onChange={(e) => setForm({ ...form, discount_type: e.target.value as any })}
                  className={INPUT}
                >
                  <option value="percentage">Porcentaje (%)</option>
                  <option value="fixed">Monto fijo (COP)</option>
                </select>
              </div>
              <div>
                <label className={LABEL}>
                  Valor {form.discount_type === "percentage" ? "(%)" : "(COP)"}
                </label>
                <input
                  type="number"
                  value={form.discount_value}
                  onChange={(e) => setForm({ ...form, discount_value: Number(e.target.value) })}
                  min={0}
                  max={form.discount_type === "percentage" ? 100 : undefined}
                  step={form.discount_type === "percentage" ? 1 : 1000}
                  className={INPUT}
                  required
                />
              </div>
              <div>
                <label className={LABEL}>Usos máximos</label>
                <input
                  type="number"
                  value={form.max_uses ?? ""}
                  onChange={(e) =>
                    setForm({ ...form, max_uses: e.target.value ? Number(e.target.value) : null })
                  }
                  placeholder="Ilimitado"
                  min={1}
                  className={INPUT}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL}>Fecha inicio</label>
                <input
                  type="datetime-local"
                  value={form.starts_at}
                  onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
                  className={INPUT}
                  required
                />
              </div>
              <div>
                <label className={LABEL}>Fecha fin</label>
                <input
                  type="datetime-local"
                  value={form.ends_at}
                  onChange={(e) => setForm({ ...form, ends_at: e.target.value })}
                  className={INPUT}
                  required
                />
              </div>
            </div>

            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  className="accent-[#221A33]"
                />
                <span className="text-xs text-gray-600">Activo</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_cumulative}
                  onChange={(e) => setForm({ ...form, is_cumulative: e.target.checked })}
                  className="accent-[#221A33]"
                />
                <span className="text-xs text-gray-600">Acumulable con otros descuentos</span>
              </label>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 bg-[#221A33] text-white text-xs rounded hover:bg-[#352A4B] disabled:opacity-50"
              >
                {saving ? "Guardando…" : "Guardar"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-5 py-2 border border-gray-200 text-gray-500 text-xs rounded hover:bg-gray-50"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-14 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      ) : promos.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-200 rounded py-16 text-center">
          <Tag size={28} className="mx-auto mb-3 text-gray-300" />
          <p className="text-sm text-gray-400">No hay descuentos configurados.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 text-left">Nombre</th>
                <th className="px-4 py-3 text-left">Código</th>
                <th className="px-4 py-3 text-center">Descuento</th>
                <th className="px-4 py-3 text-center">Usos</th>
                <th className="px-4 py-3 text-center">Vigencia</th>
                <th className="px-4 py-3 text-center">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {promos.map((p) => {
                const st = promoStatus(p);
                return (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-[500] text-gray-800">{p.name}</td>
                    <td className="px-4 py-3">
                      {p.code ? (
                        <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">
                          {p.code}
                        </span>
                      ) : (
                        <span className="text-gray-300 text-xs">Automático</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 font-[600] text-gray-800">
                        {p.discount_type === "percentage" ? (
                          <><Percent size={12} /> {p.discount_value}%</>
                        ) : (
                          <>{formatCOP(p.discount_value)}</>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-500 text-xs">
                      {p.used_count}/{p.max_uses ?? "∞"}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-400 text-xs">
                      {formatDateShort(p.starts_at)} → {formatDateShort(p.ends_at)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => toggleActive(p)}
                        className={`text-[10px] px-2 py-0.5 rounded-full font-[500] ${st.cls}`}
                      >
                        {st.label}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(p)}
                          className="p-1.5 text-gray-400 hover:text-gray-600"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
