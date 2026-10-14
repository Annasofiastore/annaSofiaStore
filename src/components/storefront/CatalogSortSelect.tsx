"use client";

export function CatalogSortSelect({ current }: { current?: string }) {
  const options = [
    { value: "novedades", label: "Novedades" },
    { value: "precio_asc", label: "Precio: menor a mayor" },
    { value: "precio_desc", label: "Precio: mayor a menor" },
  ];

  return (
    <form method="GET">
      <select
        name="orden"
        defaultValue={current ?? "novedades"}
        onChange={(e) => (e.currentTarget.form as HTMLFormElement).submit()}
        className="text-xs text-[#1E1B2E] border border-[#E9DDE3] bg-[#FAF6F7] px-3 py-2 outline-none cursor-pointer"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </form>
  );
}
