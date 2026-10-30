"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

export function CatalogSortSelect({ current }: { current?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const options = [
    { value: "novedades", label: "Novedades" },
    { value: "precio_asc", label: "Precio: menor a mayor" },
    { value: "precio_desc", label: "Precio: mayor a menor" },
  ];

  // Cambia solo el orden y conserva los demás filtros (categoría, colección, búsqueda…)
  function changeOrder(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("orden", value);
    params.delete("pagina");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <select
      name="orden"
      aria-label="Ordenar por"
      defaultValue={current ?? "novedades"}
      onChange={(e) => changeOrder(e.target.value)}
      className="max-w-full text-xs text-[#221A33] border border-[#E8DED4] bg-[#F7F2EC] px-3 py-2 outline-none cursor-pointer"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
