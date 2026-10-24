"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  from: string;
  to: string;
}

function toISO(d: Date) {
  return d.toISOString().slice(0, 10);
}

function presetRange(months: number) {
  const to = new Date();
  const from = new Date();
  from.setMonth(from.getMonth() - (months - 1), 1);
  return { from: toISO(from), to: toISO(to) };
}

function currentMonthRange() {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  return { from: toISO(from), to: toISO(now) };
}

function currentYearRange() {
  const now = new Date();
  const from = new Date(now.getFullYear(), 0, 1);
  return { from: toISO(from), to: toISO(now) };
}

const PRESETS = [
  { label: "Este mes", range: currentMonthRange },
  { label: "Últimos 3 meses", range: () => presetRange(3) },
  { label: "Últimos 6 meses", range: () => presetRange(6) },
  { label: "Este año", range: currentYearRange },
];

export function ReportDateRangeFilter({ from, to }: Props) {
  const router = useRouter();
  const [localFrom, setLocalFrom] = useState(from);
  const [localTo, setLocalTo] = useState(to);

  function apply(range?: { from: string; to: string }) {
    const f = range?.from ?? localFrom;
    const t = range?.to ?? localTo;
    if (range) {
      setLocalFrom(f);
      setLocalTo(t);
    }
    router.push(`/admin/reportes?from=${f}&to=${t}`);
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex gap-1.5">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            onClick={() => apply(p.range())}
            className="text-[11px] px-3 py-1.5 rounded border border-gray-200 text-gray-600 hover:border-[#766A63] hover:text-[#1C1B2E] transition-colors"
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-1.5 ml-1">
        <input
          type="date"
          value={localFrom}
          max={localTo}
          onChange={(e) => setLocalFrom(e.target.value)}
          className="text-[11px] border border-gray-200 rounded px-2 py-1.5 text-gray-700 focus:outline-none focus:border-[#766A63]"
        />
        <span className="text-xs text-gray-400">a</span>
        <input
          type="date"
          value={localTo}
          min={localFrom}
          max={toISO(new Date())}
          onChange={(e) => setLocalTo(e.target.value)}
          className="text-[11px] border border-gray-200 rounded px-2 py-1.5 text-gray-700 focus:outline-none focus:border-[#766A63]"
        />
        <button
          onClick={() => apply()}
          className="text-[11px] px-3 py-1.5 rounded bg-[#1C1B2E] text-[#F7F2EC] hover:bg-[#2D2C44] transition-colors"
        >
          Aplicar
        </button>
      </div>
    </div>
  );
}
