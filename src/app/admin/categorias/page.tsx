"use client";

import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { slugify } from "@/lib/utils/format";

type Category = { id: string; name: string; slug: string; description: string | null; image_url?: string | null; sort_order: number };
type Occasion = { id: string; name: string; slug: string; sort_order: number };

const INPUT = "w-full border border-[#e5e7eb] bg-white px-3 py-2 text-sm focus:outline-none focus:border-[#766A63] transition-colors placeholder:text-gray-300";
const LABEL = "block text-xs font-[500] text-gray-500 mb-1";

function CrudSection<T extends { id: string; name: string; slug: string; sort_order: number }>({
  title,
  table,
  hasDescription,
  hasImage,
}: {
  title: string;
  table: string;
  hasDescription?: boolean;
  hasImage?: boolean;
}) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", slug: "", description: "", image_url: "", sort_order: 0 });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const supabase = createClient();

  async function load() {
    const { data } = await supabase.from(table).select("*").order("sort_order", { ascending: true });
    setItems((data ?? []) as T[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openNew() {
    setForm({ name: "", slug: "", description: "", image_url: "", sort_order: 0 });
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(item: T) {
    setForm({
      name: item.name,
      slug: item.slug,
      description: (item as any).description ?? "",
      image_url: (item as any).image_url ?? "",
      sort_order: item.sort_order,
    });
    setEditingId(item.id);
    setShowForm(true);
  }

  function handleNameChange(name: string) {
    setForm((f) => ({ ...f, name, slug: editingId ? f.slug : slugify(name) }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const payload: any = { name: form.name, slug: form.slug, sort_order: form.sort_order };
    if (hasDescription) payload.description = form.description;
    if (hasImage) payload.image_url = form.image_url || null;
    if (editingId) {
      await supabase.from(table).update(payload).eq("id", editingId);
    } else {
      await supabase.from(table).insert(payload);
    }
    await load();
    setShowForm(false);
    setSaving(false);
  }

  async function handleImage(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (res.ok) setForm((f) => ({ ...f, image_url: data.url }));
    else setUploadError(data.error ?? "Error al subir la imagen");
    setUploading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm(`¿Eliminar? Los productos vinculados no se eliminarán.`)) return;
    await supabase.from(table).delete().eq("id", id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-gray-800">{title}</h2>
        <button
          onClick={openNew}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1F1B19] text-white text-xs rounded hover:bg-[#3A3431] transition-colors"
        >
          <Plus size={12} /> Nuevo
        </button>
      </div>

      {showForm && (
        <div className="bg-white border border-gray-200 rounded p-4 mb-4">
          <form onSubmit={handleSave} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL}>Nombre *</label>
                <input
                  value={form.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className={INPUT}
                  required
                />
              </div>
              <div>
                <label className={LABEL}>Slug</label>
                <input
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  className={INPUT}
                  required
                />
              </div>
            </div>
            {hasDescription && (
              <div>
                <label className={LABEL}>Descripción</label>
                <input
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className={INPUT}
                  placeholder="Opcional"
                />
              </div>
            )}
            {hasImage && (
              <div>
                <label className={LABEL}>Foto (se muestra en el inicio, formato vertical)</label>
                <div className="flex items-center gap-3">
                  {form.image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={form.image_url} alt="" className="w-16 h-24 object-cover border border-gray-200" />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImage(e.target.files?.[0])}
                    className="text-xs text-gray-500"
                  />
                  {uploading && <span className="text-xs text-gray-400">Subiendo…</span>}
                  {form.image_url && !uploading && (
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, image_url: "" })}
                      className="text-xs text-gray-400 hover:text-red-500"
                    >
                      Quitar
                    </button>
                  )}
                </div>
                {uploadError && <p className="text-xs text-red-500 mt-1">{uploadError}</p>}
              </div>
            )}
            <div className="w-28">
              <label className={LABEL}>Orden</label>
              <input
                type="number"
                value={form.sort_order}
                onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
                className={INPUT}
                min={0}
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving || uploading}
                className="px-4 py-1.5 bg-[#1F1B19] text-white text-xs rounded hover:bg-[#3A3431] disabled:opacity-50"
              >
                {saving ? "Guardando…" : "Guardar"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-1.5 border border-gray-200 text-gray-500 text-xs rounded hover:bg-gray-50"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="space-y-1.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="border border-dashed border-gray-200 rounded py-8 text-center">
          <p className="text-xs text-gray-400">Sin registros.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-2.5 text-left">Nombre</th>
                <th className="px-4 py-2.5 text-left">Slug</th>
                <th className="px-4 py-2.5 text-center">Orden</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 font-[500] text-gray-800">{item.name}</td>
                  <td className="px-4 py-2.5 text-gray-400 font-mono text-xs">{item.slug}</td>
                  <td className="px-4 py-2.5 text-center text-gray-500">{item.sort_order}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(item)}
                        className="p-1 text-gray-400 hover:text-gray-600"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1 text-gray-400 hover:text-red-500"
                      >
                        <Trash2 size={13} />
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

export default function AdminCategoriasPage() {
  return (
    <div className="p-6 max-w-4xl space-y-10">
      <h1 className="text-xl font-semibold text-gray-800">Categorías y Ocasiones</h1>
      <CrudSection title="Categorías" table="categories" hasDescription hasImage />
      <CrudSection title="Ocasiones" table="occasions" />
    </div>
  );
}
