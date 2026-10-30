"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";

/**
 * Buscador de las listas del admin. Escribe el texto en el parámetro `q` de la URL y conserva
 * los demás filtros (estado, fechas…). Se busca al pulsar Enter o la lupa.
 */
export function AdminSearchBox({ basePath, placeholder }: { basePath: string; placeholder: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = searchParams.get("q") ?? "";

  function apply(q: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (q) params.set("q", q);
    else params.delete("q");
    params.delete("pagina");
    const qs = params.toString();
    router.push(qs ? `${basePath}?${qs}` : basePath);
  }

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        apply(String(new FormData(e.currentTarget).get("q") ?? "").trim());
      }}
      className="relative w-full max-w-md"
    >
      {/* key: si la búsqueda cambia desde la URL (limpiar, atrás), el campo se actualiza solo */}
      <input
        key={current}
        name="q"
        type="search"
        defaultValue={current}
        placeholder={placeholder}
        aria-label={placeholder}
        maxLength={60}
        className="w-full border border-[#E8DED4] bg-white pl-9 pr-9 py-2.5 text-sm text-[#221A33] placeholder:text-[#766A63] focus:outline-none focus:border-[#766A63] [&::-webkit-search-cancel-button]:hidden"
      />
      <button
        type="submit"
        aria-label="Buscar"
        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#766A63] hover:text-[#221A33] transition-colors"
      >
        <Search size={15} strokeWidth={1.5} />
      </button>
      {current && (
        <button
          type="button"
          onClick={() => apply("")}
          aria-label="Limpiar búsqueda"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#766A63] hover:text-[#221A33] transition-colors"
        >
          <X size={15} strokeWidth={1.5} />
        </button>
      )}
    </form>
  );
}
