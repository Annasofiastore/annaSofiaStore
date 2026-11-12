"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, ChevronsUp, GripVertical } from "lucide-react";
import { ProductThumb } from "./ProductThumb";

export type OrderItem = { id: string; name: string; image: string | null };

export function ProductOrderManager({ initial }: { initial: OrderItem[] }) {
  const [items, setItems] = useState(initial);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);

  function move(from: number, to: number) {
    if (from === to || to < 0 || to >= items.length) return;
    const next = [...items];
    const [m] = next.splice(from, 1);
    next.splice(to, 0, m);
    setItems(next);
    setDirty(true);
    setMessage(null);
  }

  async function save() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/products/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: items.map((i) => i.id) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "No se pudo guardar el orden.");
      setDirty(false);
      setMessage({ ok: true, text: "Orden guardado. Ya se ve así en el catálogo." });
    } catch (e) {
      setMessage({ ok: false, text: e instanceof Error ? e.message : "No se pudo guardar el orden." });
    } finally {
      setSaving(false);
    }
  }

  const btn =
    "p-2 text-[#766A63] hover:text-[#221A33] hover:bg-[#F7F2EC] disabled:opacity-30 disabled:hover:bg-transparent";

  return (
    <div>
      <div className="sticky top-0 z-10 flex items-center justify-between gap-3 bg-[#F7F2EC] py-3 mb-2">
        <p className="text-xs text-[#766A63]">
          El primero de la lista es el primero que ven tus clientas en el catálogo.
        </p>
        <button
          type="button"
          onClick={save}
          disabled={!dirty || saving}
          className="shrink-0 px-6 py-2.5 bg-[#221A33] text-[#F7F2EC] text-[11px] tracking-[0.18em] uppercase font-[600] hover:bg-[#A0526C] transition-colors disabled:bg-[#DCCFC4] disabled:cursor-not-allowed"
        >
          {saving ? "Guardando…" : "Guardar orden"}
        </button>
      </div>

      {message && (
        <p
          className={`text-xs px-4 py-2.5 mb-3 border ${
            message.ok
              ? "text-green-700 border-green-200 bg-green-50"
              : "text-[#A0526C] border-[#A0526C]/30 bg-[#F5DDE5]/20"
          }`}
        >
          {message.text}
        </p>
      )}

      <ol className="bg-white border border-[#E8DED4]">
        {items.map((item, idx) => (
          <li
            key={item.id}
            draggable
            onDragStart={() => setDragIdx(idx)}
            onDragEnter={() => setOverIdx(idx)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              if (dragIdx !== null) move(dragIdx, idx);
              setDragIdx(null);
              setOverIdx(null);
            }}
            onDragEnd={() => {
              setDragIdx(null);
              setOverIdx(null);
            }}
            className={`flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 border-b border-[#F7F2EC] last:border-0 ${
              dragIdx === idx ? "opacity-40" : ""
            } ${overIdx === idx && dragIdx !== null && dragIdx !== idx ? "bg-[#F5DDE5]/30" : ""}`}
          >
            <GripVertical size={16} className="hidden sm:block text-[#DCCFC4] cursor-grab shrink-0" />
            <span className="w-7 text-right text-xs tabular-nums text-[#766A63] shrink-0">{idx + 1}</span>
            <div className="w-10 shrink-0">
              {item.image ? (
                <ProductThumb src={item.image} alt={item.name} />
              ) : (
                <div className="w-10 h-12 bg-[#F5DDE5]/20" />
              )}
            </div>
            <p className="flex-1 min-w-0 truncate text-sm text-[#221A33]">{item.name}</p>
            <div className="flex shrink-0">
              <button type="button" className={btn} aria-label="Mover al inicio" disabled={idx === 0} onClick={() => move(idx, 0)}>
                <ChevronsUp size={16} />
              </button>
              <button type="button" className={btn} aria-label="Subir" disabled={idx === 0} onClick={() => move(idx, idx - 1)}>
                <ArrowUp size={16} />
              </button>
              <button type="button" className={btn} aria-label="Bajar" disabled={idx === items.length - 1} onClick={() => move(idx, idx + 1)}>
                <ArrowDown size={16} />
              </button>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
