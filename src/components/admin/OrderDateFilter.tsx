"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { CalendarDays, X } from "lucide-react";

export function OrderDateFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const dateFrom = searchParams.get("date_from") ?? "";
  const dateTo = searchParams.get("date_to") ?? "";

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`/admin/pedidos?${params.toString()}`);
  }

  function clear() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("date_from");
    params.delete("date_to");
    router.push(`/admin/pedidos?${params.toString()}`);
  }

  const hasDate = dateFrom || dateTo;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <CalendarDays size={13} className="text-[#766A63]" strokeWidth={1.5} />
      <input
        type="date"
        value={dateFrom}
        max={dateTo || undefined}
        onChange={(e) => update("date_from", e.target.value)}
        className="text-xs border border-[#E8DED4] px-2 py-1.5 text-[#221A33] focus:outline-none focus:border-[#766A63] bg-white"
      />
      <span className="text-xs text-[#DCCFC4]">—</span>
      <input
        type="date"
        value={dateTo}
        min={dateFrom || undefined}
        onChange={(e) => update("date_to", e.target.value)}
        className="text-xs border border-[#E8DED4] px-2 py-1.5 text-[#221A33] focus:outline-none focus:border-[#766A63] bg-white"
      />
      {hasDate && (
        <button
          onClick={clear}
          title="Limpiar fechas"
          className="text-[#766A63] hover:text-[#221A33] transition-colors"
        >
          <X size={13} strokeWidth={2} />
        </button>
      )}
    </div>
  );
}
