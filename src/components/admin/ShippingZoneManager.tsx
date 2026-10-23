"use client";

import { useEffect, useState } from "react";
import { Plus, X, Pencil, Check } from "lucide-react";
import { formatCOP } from "@/lib/utils/format";

type City = { id: string; city_name: string };
type Zone = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  price: number;
  sort_order: number;
  cities: City[];
};

const ZONE_COLORS: Record<string, string> = {
  local: "bg-[#F2DCD6]/50 text-[#965C57]",
  main_cities: "bg-[#F7F2EC] text-[#766A63]",
  municipalities: "bg-gray-100 text-gray-500",
};

export function ShippingZoneManager() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingZone, setEditingZone] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState<string>("");
  const [saving, setSaving] = useState<string | null>(null);
  const [newCity, setNewCity] = useState<Record<string, string>>({});
  const [addingCity, setAddingCity] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAddZone, setShowAddZone] = useState(false);
  const [newZoneName, setNewZoneName] = useState("");
  const [newZoneDesc, setNewZoneDesc] = useState("");
  const [newZonePrice, setNewZonePrice] = useState("");
  const [creatingZone, setCreatingZone] = useState(false);

  async function load() {
    const res = await fetch("/api/admin/shipping-zones");
    if (res.ok) setZones(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function savePrice(zoneId: string) {
    setSaving(zoneId);
    setError(null);
    const res = await fetch("/api/admin/shipping-zones", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: zoneId, price: parseFloat(editPrice) }),
    });
    if (res.ok) {
      setZones((prev) => prev.map((z) => z.id === zoneId ? { ...z, price: parseFloat(editPrice) } : z));
      setEditingZone(null);
    } else {
      const d = await res.json();
      setError(d.error ?? "Error al guardar");
    }
    setSaving(null);
  }

  async function addCity(zoneId: string) {
    const city = newCity[zoneId]?.trim();
    if (!city) return;
    setAddingCity(zoneId);
    setError(null);
    const res = await fetch("/api/admin/shipping-zones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ zone_id: zoneId, city_name: city }),
    });
    if (res.ok) {
      setNewCity((prev) => ({ ...prev, [zoneId]: "" }));
      await load();
    } else {
      const d = await res.json();
      setError(d.error ?? "Error al agregar ciudad");
    }
    setAddingCity(null);
  }

  async function createZone() {
    const name = newZoneName.trim();
    const price = parseFloat(newZonePrice);
    if (!name || Number.isNaN(price) || price < 0) {
      setError("Completa el nombre y un precio válido para la nueva zona");
      return;
    }
    setCreatingZone(true);
    setError(null);
    const res = await fetch("/api/admin/shipping-zones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description: newZoneDesc.trim() || undefined, price }),
    });
    if (res.ok) {
      setNewZoneName("");
      setNewZoneDesc("");
      setNewZonePrice("");
      setShowAddZone(false);
      await load();
    } else {
      const d = await res.json();
      setError(d.error ?? "Error al crear la zona");
    }
    setCreatingZone(false);
  }

  async function removeCity(cityId: string) {
    setError(null);
    const res = await fetch("/api/admin/shipping-zones", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: cityId }),
    });
    if (res.ok) setZones((prev) => prev.map((z) => ({ ...z, cities: z.cities.filter((c) => c.id !== cityId) })));
    else {
      const d = await res.json();
      setError(d.error ?? "Error al eliminar ciudad");
    }
  }

  if (loading) return <div className="h-40 bg-gray-100 animate-pulse rounded" />;

  return (
    <div className="space-y-4">
      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2">{error}</p>
      )}

      {zones.map((zone) => (
        <div key={zone.id} className="bg-white border border-gray-200 rounded overflow-hidden">
          {/* Encabezado de zona */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3 min-w-0">
              <span className={`text-[10px] px-2 py-0.5 rounded font-[600] uppercase tracking-wide shrink-0 ${ZONE_COLORS[zone.code] ?? "bg-gray-100 text-gray-500"}`}>
                Zona {zone.sort_order}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-[600] text-gray-800">{zone.name}</p>
                {zone.description && <p className="text-xs text-gray-400 truncate">{zone.description}</p>}
              </div>
            </div>

            {/* Precio editable */}
            <div className="flex items-center gap-2 shrink-0">
              {editingZone === zone.id ? (
                <>
                  <span className="text-xs text-gray-400">$</span>
                  <input
                    type="number"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    className="w-28 border border-gray-200 px-2 py-1 text-sm text-gray-800 focus:outline-none focus:border-[#766A63]"
                    min={0}
                    step={1000}
                    autoFocus
                  />
                  <button
                    onClick={() => savePrice(zone.id)}
                    disabled={saving === zone.id}
                    className="p-1.5 text-green-600 hover:text-green-800 transition-colors disabled:opacity-50"
                    title="Guardar"
                  >
                    <Check size={15} />
                  </button>
                  <button
                    onClick={() => setEditingZone(null)}
                    className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Cancelar"
                  >
                    <X size={15} />
                  </button>
                </>
              ) : (
                <>
                  <span className="text-sm font-[600] text-[#1F1B19]">{formatCOP(zone.price)}</span>
                  <button
                    onClick={() => { setEditingZone(zone.id); setEditPrice(String(zone.price)); }}
                    className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Editar precio"
                  >
                    <Pencil size={13} />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Ciudades (no mostrar para municipios — es el fallback) */}
          {zone.code !== "municipalities" && (
            <div className="px-5 py-4 space-y-3">
              <p className="text-[10px] uppercase tracking-[0.15em] text-gray-400 font-[600]">
                Ciudades incluidas ({zone.cities.length})
              </p>

              {/* Lista de ciudades */}
              <div className="flex flex-wrap gap-1.5">
                {zone.cities.map((city) => (
                  <span
                    key={city.id}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-50 border border-gray-200 text-xs text-gray-600 rounded"
                  >
                    {city.city_name}
                    <button
                      onClick={() => removeCity(city.id)}
                      className="text-gray-300 hover:text-red-400 transition-colors ml-0.5"
                      title="Quitar ciudad"
                    >
                      <X size={11} />
                    </button>
                  </span>
                ))}
                {zone.cities.length === 0 && (
                  <p className="text-xs text-gray-300 italic">Sin ciudades asignadas</p>
                )}
              </div>

              {/* Agregar ciudad */}
              <div className="flex gap-2 mt-2">
                <input
                  type="text"
                  value={newCity[zone.id] ?? ""}
                  onChange={(e) => setNewCity((prev) => ({ ...prev, [zone.id]: e.target.value }))}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCity(zone.id); } }}
                  placeholder="Agregar ciudad…"
                  className="flex-1 border border-gray-200 px-3 py-1.5 text-xs text-gray-700 focus:outline-none focus:border-[#766A63] transition-colors"
                />
                <button
                  onClick={() => addCity(zone.id)}
                  disabled={addingCity === zone.id || !newCity[zone.id]?.trim()}
                  className="flex items-center gap-1 px-3 py-1.5 bg-[#1F1B19] text-white text-xs rounded hover:bg-[#3A3431] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus size={12} />
                  {addingCity === zone.id ? "…" : "Agregar"}
                </button>
              </div>
            </div>
          )}

          {zone.code === "municipalities" && (
            <div className="px-5 py-3">
              <p className="text-xs text-gray-400 italic">
                Aplica a todos los municipios no incluidos en las zonas anteriores.
              </p>
            </div>
          )}
        </div>
      ))}

      {/* Crear nueva zona */}
      <div className="bg-white border border-gray-200 rounded overflow-hidden">
        {showAddZone ? (
          <div className="px-5 py-4 space-y-3">
            <p className="text-[10px] uppercase tracking-[0.15em] text-gray-400 font-[600]">
              Nueva zona de envío
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              <input
                type="text"
                value={newZoneName}
                onChange={(e) => setNewZoneName(e.target.value)}
                placeholder="Nombre de la zona (ej. Eje Cafetero)"
                className="border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-[#766A63] sm:col-span-2"
              />
              <input
                type="text"
                value={newZoneDesc}
                onChange={(e) => setNewZoneDesc(e.target.value)}
                placeholder="Descripción (opcional)"
                className="border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-[#766A63] sm:col-span-2"
              />
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">$</span>
                <input
                  type="number"
                  value={newZonePrice}
                  onChange={(e) => setNewZonePrice(e.target.value)}
                  placeholder="Precio de envío"
                  min={0}
                  step={1000}
                  className="flex-1 border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-[#766A63]"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={createZone}
                disabled={creatingZone}
                className="flex items-center gap-1 px-4 py-2 bg-[#1F1B19] text-white text-xs rounded hover:bg-[#3A3431] transition-colors disabled:opacity-50"
              >
                {creatingZone ? "Creando…" : "Crear zona"}
              </button>
              <button
                onClick={() => setShowAddZone(false)}
                className="px-4 py-2 text-xs text-gray-500 hover:text-gray-700 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowAddZone(true)}
            className="w-full flex items-center justify-center gap-2 px-5 py-4 text-sm text-gray-500 hover:text-[#1F1B19] hover:bg-gray-50 transition-colors"
          >
            <Plus size={15} />
            Agregar nueva zona
          </button>
        )}
      </div>
    </div>
  );
}
