"use client";

import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Eye, EyeOff, Home } from "lucide-react";
import { slugify } from "@/lib/utils/format";
import { ImageUploader } from "@/components/admin/ImageUploader";

type Collection = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  hero_url: string | null;
  sort_order: number;
  is_active: boolean;
  featured_on_home: boolean;
};

const EMPTY: Omit<Collection, "id"> = {
  name: "",
  slug: "",
  description: "",
  hero_url: "",
  sort_order: 0,
  is_active: true,
  featured_on_home: false,
};

const INPUT = "w-full border border-[#e5e7eb] bg-white px-3 py-2 text-sm text-[#111827] focus:outline-none focus:border-[#766A63] transition-colors placeholder:text-gray-300";
const LABEL = "block text-xs font-[500] text-gray-500 mb-1";

export default function AdminColeccionesPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<Collection, "id">>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  async function loadCollections() {
    const res = await fetch("/api/admin/collections");
    if (res.ok) {
      setCollections(await res.json());
    }
    setLoading(false);
  }

  useEffect(() => { loadCollections(); }, []);

  function openNew() {
    setForm(EMPTY);
    setEditingId(null);
    setSaveError(null);
    setShowForm(true);
  }

  function openEdit(c: Collection) {
    const { id, ...rest } = c;
    setForm(rest);
    setEditingId(id);
    setSaveError(null);
    setShowForm(true);
  }

  function handleNameChange(name: string) {
    setForm((f) => ({
      ...f,
      name,
      slug: editingId ? f.slug : slugify(name),
    }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);

    const method = editingId ? "PUT" : "POST";
    const body = editingId ? { id: editingId, ...form } : form;

    const res = await fetch("/api/admin/collections", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const data = await res.json();
      setSaveError(data.error ?? "Error al guardar la colección");
      setSaving(false);
      return;
    }

    await loadCollections();
    setShowForm(false);
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar esta colección? Los productos no se eliminarán.")) return;
    await fetch("/api/admin/collections", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setCollections((prev) => prev.filter((c) => c.id !== id));
  }

  async function toggleActive(c: Collection) {
    await fetch("/api/admin/collections", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: c.id, is_active: !c.is_active }),
    });
    setCollections((prev) => prev.map((x) => (x.id === c.id ? { ...x, is_active: !x.is_active } : x)));
  }

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-800">Colecciones</h1>
        <button
          onClick={openNew}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1C1B2E] text-white text-xs rounded hover:bg-[#2D2C44] transition-colors"
        >
          <Plus size={14} /> Nueva colección
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded p-5 mb-6">
          <p className="text-sm font-[600] text-gray-800 mb-4">
            {editingId ? "Editar colección" : "Nueva colección"}
          </p>
          <form onSubmit={handleSave} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL}>Nombre *</label>
                <input
                  value={form.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Ej: Verano 2026"
                  className={INPUT}
                  required
                />
              </div>
              <div>
                <label className={LABEL}>Slug (URL)</label>
                <input
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  placeholder="verano-2026"
                  className={INPUT}
                  required
                />
              </div>
            </div>
            <div>
              <label className={LABEL}>Descripción</label>
              <textarea
                value={form.description ?? ""}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
                className={INPUT}
                placeholder="Descripción breve de la colección"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL}>Imagen hero</label>
                <ImageUploader
                  images={form.hero_url ? [form.hero_url] : []}
                  onChange={(imgs) => setForm({ ...form, hero_url: imgs[0] ?? "" })}
                  maxImages={1}
                />
              </div>
              <div>
                <label className={LABEL}>Orden</label>
                <input
                  type="number"
                  value={form.sort_order}
                  onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
                  className={INPUT}
                  min={0}
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  className="accent-[#1C1B2E]"
                />
                <span className="text-xs text-gray-600">Colección activa (visible en el storefront)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.featured_on_home}
                  onChange={(e) => setForm({ ...form, featured_on_home: e.target.checked })}
                  className="accent-[#A0526C]"
                />
                <span className="text-xs text-gray-600 flex items-center gap-1">
                  <Home size={11} className="text-[#A0526C]" />
                  Destacar en inicio (reemplaza la colección actual del home)
                </span>
              </label>
            </div>

            {saveError && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2">
                {saveError}
              </p>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 bg-[#1C1B2E] text-white text-xs rounded hover:bg-[#2D2C44] transition-colors disabled:opacity-50"
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
      ) : collections.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-200 rounded py-16 text-center">
          <p className="text-sm text-gray-400">No hay colecciones todavía.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 text-left">Nombre</th>
                <th className="px-4 py-3 text-left">Slug</th>
                <th className="px-4 py-3 text-center">Orden</th>
                <th className="px-4 py-3 text-center">Inicio</th>
                <th className="px-4 py-3 text-center">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {collections.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-[500] text-gray-800">{c.name}</td>
                  <td className="px-4 py-3 text-gray-400 font-mono text-xs">{c.slug}</td>
                  <td className="px-4 py-3 text-center text-gray-500">{c.sort_order}</td>
                  <td className="px-4 py-3 text-center">
                    {c.featured_on_home && (
                      <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-[500] bg-[#F5DDE5]/60 text-[#A0526C]">
                        <Home size={11} /> Inicio
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => toggleActive(c)}
                      title={c.is_active ? "Desactivar" : "Activar"}
                      className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-[500] ${
                        c.is_active
                          ? "bg-green-50 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {c.is_active ? (
                        <><Eye size={11} /> Activa</>
                      ) : (
                        <><EyeOff size={11} /> Inactiva</>
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(c)}
                        className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
