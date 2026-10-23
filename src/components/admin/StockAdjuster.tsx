"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, Check, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const REASONS = [
  { value: "venta_whatsapp", label: "Venta por WhatsApp" },
  { value: "devolucion", label: "Devolución" },
  { value: "entrada", label: "Entrada de mercancía" },
  { value: "conteo", label: "Conteo físico / corrección" },
  { value: "dano", label: "Dañado o perdido" },
] as const;

type Props = {
  variantId: string;
  stock: number;
  reserved: number;
};

export function StockAdjuster({ variantId, stock, reserved }: Props) {
  const router = useRouter();
  const [saved, setSaved] = useState(stock);
  const [value, setValue] = useState(String(stock));
  const [reason, setReason] = useState<string>("venta_whatsapp");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parsed = Number(value);
  // El campo vacío no cuenta como 0: si no, borrar para reescribir dispararía
  // el panel de motivo con un ajuste a 0 que nadie pidió.
  const valid = value !== "" && Number.isInteger(parsed) && parsed >= 0;
  const dirty = valid && parsed !== saved;

  function bump(delta: number) {
    setError(null);
    setValue(String(Math.max(0, (valid ? parsed : saved) + delta)));
  }

  function reset() {
    setValue(String(saved));
    setNote("");
    setError(null);
  }

  async function save() {
    if (!dirty || saving) return;
    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/inventory/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId, newStock: parsed, reason, note }),
      });
      const data = await res.json();

      if (!res.ok) {
        // El valor optimista se revierte: el stock real sigue siendo el anterior.
        setValue(String(saved));
        setError(data.error ?? "No se pudo guardar el ajuste");
        return;
      }

      setSaved(data.stock);
      setValue(String(data.stock));
      setNote("");
      router.refresh();
    } catch {
      setValue(String(saved));
      setError("Sin conexión. Revisa tu internet e intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="w-full md:w-auto">
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => bump(-1)}
          disabled={saving || (valid ? parsed : saved) === 0}
          aria-label="Restar una unidad"
          className="h-11 w-11 shrink-0 flex items-center justify-center border border-[#E8DED4] bg-white text-[#1F1B19] disabled:opacity-30 active:bg-[#F7F2EC]"
        >
          <Minus size={16} strokeWidth={1.5} />
        </button>

        <input
          type="text"
          inputMode="numeric"
          value={value}
          onChange={(e) => {
            setError(null);
            setValue(e.target.value.replace(/[^0-9]/g, ""));
          }}
          disabled={saving}
          aria-label="Cantidad en stock"
          className={cn(
            "h-11 w-16 shrink-0 border text-center text-base text-[#1F1B19] bg-white",
            dirty ? "border-[#965C57]" : "border-[#E8DED4]"
          )}
        />

        <button
          type="button"
          onClick={() => bump(1)}
          disabled={saving}
          aria-label="Sumar una unidad"
          className="h-11 w-11 shrink-0 flex items-center justify-center border border-[#E8DED4] bg-white text-[#1F1B19] disabled:opacity-30 active:bg-[#F7F2EC]"
        >
          <Plus size={16} strokeWidth={1.5} />
        </button>

        <button
          type="button"
          onClick={() => {
            setError(null);
            setValue("0");
          }}
          disabled={saving || saved === 0}
          className="h-11 px-3 shrink-0 border border-[#E8DED4] bg-white text-[10px] tracking-[0.15em] uppercase text-[#766A63] disabled:opacity-30 active:bg-[#F7F2EC]"
        >
          Agotar
        </button>
      </div>

      {dirty && (
        <div className="mt-2 flex flex-col gap-2 border border-[#965C57]/40 bg-[#F7F2EC] p-2.5">
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={saving}
            aria-label="Motivo del ajuste"
            className="h-11 w-full border border-[#E8DED4] bg-white px-2 text-sm text-[#1F1B19]"
          >
            {REASONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>

          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            disabled={saving}
            placeholder="Nota (opcional)"
            className="h-11 w-full border border-[#E8DED4] bg-white px-2 text-sm text-[#1F1B19] placeholder:text-[#766A63]"
          />

          <div className="flex gap-2">
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="h-11 flex-1 flex items-center justify-center gap-2 bg-[#1F1B19] text-[11px] tracking-[0.15em] uppercase text-[#F7F2EC] disabled:opacity-50"
            >
              {saving ? (
                <Loader2 size={14} strokeWidth={1.5} className="animate-spin" />
              ) : (
                <Check size={14} strokeWidth={1.5} />
              )}
              {saved} → {parsed}
            </button>
            <button
              type="button"
              onClick={reset}
              disabled={saving}
              aria-label="Cancelar ajuste"
              className="h-11 w-11 shrink-0 flex items-center justify-center border border-[#E8DED4] bg-white text-[#766A63] disabled:opacity-50"
            >
              <X size={16} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      )}

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

      {reserved > 0 && (
        <p className="mt-1 text-[11px] text-[#766A63]">
          {reserved} reservada{reserved === 1 ? "" : "s"} en carritos
        </p>
      )}
    </div>
  );
}
