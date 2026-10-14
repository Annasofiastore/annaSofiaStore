"use client";

import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, MapPin, Star } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils/cn";

const DEPARTAMENTOS = [
  "Amazonas","Antioquia","Arauca","Atlántico","Bolívar","Boyacá","Caldas","Caquetá",
  "Casanare","Cauca","Cesar","Chocó","Córdoba","Cundinamarca","Guainía","Guaviare",
  "Huila","La Guajira","Magdalena","Meta","Nariño","Norte de Santander","Putumayo",
  "Quindío","Risaralda","San Andrés y Providencia","Santander","Sucre","Tolima",
  "Valle del Cauca","Vaupés","Vichada",
];

type Address = {
  id: string;
  label: string;
  full_name: string;
  phone: string;
  address: string;
  city: string;
  department: string;
  is_default: boolean;
};

const EMPTY: Omit<Address, "id"> = {
  label: "Principal",
  full_name: "",
  phone: "",
  address: "",
  city: "",
  department: "Bolívar",
  is_default: false,
};

const INPUT = "w-full border border-[#E9DDE3] bg-white px-3 py-2.5 text-sm text-[#1E1B2E] focus:outline-none focus:border-[#6E6680] transition-colors placeholder:text-[#D9C3CE]";
const LABEL = "block text-[10px] uppercase tracking-[0.15em] text-[#6E6680] font-[600] mb-1";

export default function DireccionesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<Address, "id">>(EMPTY);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  async function fetchAddresses(cid: string) {
    const { data } = await supabase
      .from("customer_addresses")
      .select("*")
      .eq("customer_id", cid)
      .order("is_default", { ascending: false });
    setAddresses(data ?? []);
  }

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const { data: c } = await supabase
        .from("customers")
        .select("id")
        .eq("auth_user_id", user.id)
        .single();
      if (c) {
        setCustomerId(c.id);
        await fetchAddresses(c.id);
      }
      setLoading(false);
    })();
  }, []);

  function openNew() {
    setForm(EMPTY);
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(addr: Address) {
    const { id, ...rest } = addr;
    setForm(rest);
    setEditingId(id);
    setShowForm(true);
  }

  async function handleDelete(id: string) {
    await supabase.from("customer_addresses").delete().eq("id", id);
    setAddresses((prev) => prev.filter((a) => a.id !== id));
  }

  async function handleSetDefault(id: string) {
    if (!customerId) return;
    await supabase
      .from("customer_addresses")
      .update({ is_default: false })
      .eq("customer_id", customerId);
    await supabase.from("customer_addresses").update({ is_default: true }).eq("id", id);
    setAddresses((prev) => prev.map((a) => ({ ...a, is_default: a.id === id })));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!customerId) return;
    setSaving(true);

    if (form.is_default) {
      await supabase
        .from("customer_addresses")
        .update({ is_default: false })
        .eq("customer_id", customerId);
    }

    if (editingId) {
      await supabase.from("customer_addresses").update(form).eq("id", editingId);
    } else {
      await supabase
        .from("customer_addresses")
        .insert({ ...form, customer_id: customerId });
    }

    await fetchAddresses(customerId);
    setShowForm(false);
    setSaving(false);
  }

  function field(key: keyof Omit<Address, "id">, value: string | boolean) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[0, 1].map((i) => (
          <div key={i} className="h-28 bg-white border border-[#E9DDE3] animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2
          className="text-xl text-[#1E1B2E]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Direcciones
        </h2>
        <button
          onClick={openNew}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1E1B2E] text-[#FAF6F7] text-[11px] tracking-[0.15em] uppercase font-[500] hover:bg-[#A0647E] transition-colors rounded-full"
        >
          <Plus size={13} /> Nueva
        </button>
      </div>

      {/* Formulario */}
      {showForm && (
        <div className="bg-white border border-[#E9DDE3] p-5 mb-5">
          <p className="text-sm font-[600] text-[#1E1B2E] mb-4">
            {editingId ? "Editar dirección" : "Nueva dirección"}
          </p>
          <form onSubmit={handleSave} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={LABEL}>Etiqueta</label>
                <input
                  value={form.label}
                  onChange={(e) => field("label", e.target.value)}
                  placeholder="Casa, Oficina…"
                  className={INPUT}
                  required
                />
              </div>
              <div>
                <label className={LABEL}>Nombre completo</label>
                <input
                  value={form.full_name}
                  onChange={(e) => field("full_name", e.target.value)}
                  placeholder="Quien recibe el pedido"
                  className={INPUT}
                  required
                />
              </div>
            </div>
            <div>
              <label className={LABEL}>Teléfono</label>
              <input
                value={form.phone}
                onChange={(e) => field("phone", e.target.value)}
                placeholder="3XX XXX XXXX"
                className={INPUT}
                required
              />
            </div>
            <div>
              <label className={LABEL}>Dirección</label>
              <input
                value={form.address}
                onChange={(e) => field("address", e.target.value)}
                placeholder="Calle, número, apto, barrio"
                className={INPUT}
                required
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={LABEL}>Ciudad</label>
                <input
                  value={form.city}
                  onChange={(e) => field("city", e.target.value)}
                  placeholder="Cartagena"
                  className={INPUT}
                  required
                />
              </div>
              <div>
                <label className={LABEL}>Departamento</label>
                <select
                  value={form.department}
                  onChange={(e) => field("department", e.target.value)}
                  className={INPUT}
                >
                  {DEPARTAMENTOS.map((d) => (
                    <option key={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_default}
                onChange={(e) => field("is_default", e.target.checked)}
                className="accent-[#1E1B2E] w-3.5 h-3.5"
              />
              <span className="text-xs text-[#6E6680]">Usar como dirección predeterminada</span>
            </label>
            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 bg-[#1E1B2E] text-[#FAF6F7] text-[11px] uppercase tracking-[0.15em] font-[500] hover:bg-[#A0647E] transition-colors disabled:opacity-50 rounded-full"
              >
                {saving ? "Guardando…" : "Guardar"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-5 py-2.5 border border-[#E9DDE3] text-[#6E6680] text-[11px] uppercase tracking-[0.15em] font-[500] hover:border-[#6E6680] transition-colors rounded-full"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista */}
      {addresses.length === 0 && !showForm ? (
        <div className="bg-white border border-[#E9DDE3] py-14 text-center">
          <MapPin size={36} className="mx-auto mb-3 text-[#D9C3CE]" />
          <p className="text-sm text-[#6E6680]">No tienes direcciones guardadas.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className={cn(
                "bg-white border p-4",
                addr.is_default ? "border-[#A0647E]" : "border-[#E9DDE3]"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] uppercase tracking-[0.12em] font-[600] text-[#1E1B2E]">
                      {addr.label}
                    </span>
                    {addr.is_default && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-[#A0647E] font-[500]">
                        <Star size={9} fill="currentColor" /> Predeterminada
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-[#1E1B2E]">{addr.full_name}</p>
                  <p className="text-xs text-[#6E6680] mt-0.5">{addr.address}</p>
                  <p className="text-xs text-[#6E6680]">
                    {addr.city}, {addr.department}
                  </p>
                  <p className="text-xs text-[#6E6680]">{addr.phone}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {!addr.is_default && (
                    <button
                      onClick={() => handleSetDefault(addr.id)}
                      title="Marcar como predeterminada"
                      className="p-1.5 text-[#D9C3CE] hover:text-[#A0647E] transition-colors"
                    >
                      <Star size={14} />
                    </button>
                  )}
                  <button
                    onClick={() => openEdit(addr)}
                    className="p-1.5 text-[#D9C3CE] hover:text-[#6E6680] transition-colors"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(addr.id)}
                    className="p-1.5 text-[#D9C3CE] hover:text-[#A0647E] transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
