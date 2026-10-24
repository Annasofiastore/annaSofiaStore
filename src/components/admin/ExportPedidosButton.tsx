"use client";

import { useState, useRef, useEffect } from "react";
import { Download } from "lucide-react";

interface Props {
  currentStatus?: string;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function firstDayOfMonthISO() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

export function ExportPedidosButton({ currentStatus }: Props) {
  const [open, setOpen] = useState(false);
  const [from, setFrom] = useState(firstDayOfMonthISO());
  const [to, setTo] = useState(todayISO());
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function handleDownload() {
    const params = new URLSearchParams({ from, to });
    if (currentStatus) params.set("status", currentStatus);
    window.location.href = `/api/admin/pedidos/export?${params.toString()}`;
    setOpen(false);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 text-[10px] tracking-[0.15em] uppercase px-4 py-2.5 border border-[#1C1B2E] text-[#1C1B2E] font-[500] hover:bg-[#1C1B2E] hover:text-[#F7F2EC] transition-colors"
      >
        <Download size={13} strokeWidth={1.5} />
        Exportar a Excel
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-20 bg-white border border-[#E8DED4] shadow-lg p-4 w-72">
          <p className="text-[10px] tracking-[0.15em] uppercase text-[#766A63] font-[600] mb-3">
            Rango de fechas
          </p>
          <div className="flex flex-col gap-3 mb-4">
            <label className="flex flex-col gap-1">
              <span className="text-[10px] text-[#766A63]">Desde</span>
              <input
                type="date"
                value={from}
                max={to}
                onChange={(e) => setFrom(e.target.value)}
                className="border border-[#E8DED4] px-2 py-1.5 text-sm text-[#1C1B2E] focus:outline-none focus:border-[#766A63]"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[10px] text-[#766A63]">Hasta</span>
              <input
                type="date"
                value={to}
                min={from}
                max={todayISO()}
                onChange={(e) => setTo(e.target.value)}
                className="border border-[#E8DED4] px-2 py-1.5 text-sm text-[#1C1B2E] focus:outline-none focus:border-[#766A63]"
              />
            </label>
          </div>
          {currentStatus && (
            <p className="text-[10px] text-[#766A63] mb-3">
              Se exportarán solo los pedidos con estado filtrado actualmente.
            </p>
          )}
          <button
            onClick={handleDownload}
            className="w-full text-[10px] tracking-[0.15em] uppercase px-4 py-2.5 bg-[#1C1B2E] text-[#F7F2EC] font-[500] hover:bg-[#2D2C44] transition-colors"
          >
            Descargar reporte
          </button>
        </div>
      )}
    </div>
  );
}
