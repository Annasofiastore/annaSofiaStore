"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";
import { cn } from "@/lib/utils/cn";
import type { Category, Collection, Occasion } from "@/types";

interface Props {
  categories: Category[];
  collections: Collection[];
  occasions: Occasion[];
  current: Record<string, string | undefined>;
  onFilterApplied?: () => void;
}

export function CatalogFilters({ categories, collections, occasions, current, onFilterApplied }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const setFilter = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete("pagina");
      router.push(`${pathname}?${params.toString()}`);
      onFilterApplied?.();
    },
    [searchParams, pathname, router, onFilterApplied]
  );

  const clearAll = () => {
    router.push(pathname);
    onFilterApplied?.();
  };

  const hasFilters = Object.values(current).some(Boolean);

  return (
    <div className="space-y-8">
      {hasFilters && (
        <button
          onClick={clearAll}
          className="text-[10px] tracking-[0.2em] uppercase text-[#965C57] hover:text-[#1F1B19] font-[500] transition-colors"
        >
          Limpiar filtros ×
        </button>
      )}

      {/* CATEGORÍAS */}
      {categories.length > 0 && (
        <FilterGroup title="Categoría">
          {categories.map((cat) => (
            <FilterOption
              key={cat.id}
              label={cat.name}
              active={current.categoria === cat.slug}
              onClick={() =>
                setFilter(
                  "categoria",
                  current.categoria === cat.slug ? null : cat.slug
                )
              }
            />
          ))}
        </FilterGroup>
      )}

      {/* COLECCIONES */}
      {collections.length > 0 && (
        <FilterGroup title="Colección">
          {collections.map((col) => (
            <FilterOption
              key={col.id}
              label={col.name}
              active={current.coleccion === col.slug}
              onClick={() =>
                setFilter(
                  "coleccion",
                  current.coleccion === col.slug ? null : col.slug
                )
              }
            />
          ))}
        </FilterGroup>
      )}

      {/* OCASIONES */}
      {occasions.length > 0 && (
        <FilterGroup title="Ocasión">
          {occasions.map((occ) => (
            <FilterOption
              key={occ.id}
              label={occ.name}
              active={current.ocasion === occ.slug}
              onClick={() =>
                setFilter(
                  "ocasion",
                  current.ocasion === occ.slug ? null : occ.slug
                )
              }
            />
          ))}
        </FilterGroup>
      )}

      {/* TALLAS */}
      <FilterGroup title="Talla">
        {["XS", "S", "M", "L", "XL", "XXL"].map((t) => (
          <FilterOption
            key={t}
            label={t}
            active={current.talla === t}
            onClick={() =>
              setFilter("talla", current.talla === t ? null : t)
            }
          />
        ))}
      </FilterGroup>

      {/* PRECIO */}
      <FilterGroup title="Precio">
        {[
          { label: "Hasta $100.000", min: undefined, max: "100000" },
          { label: "$100.000 – $200.000", min: "100000", max: "200000" },
          { label: "$200.000 – $400.000", min: "200000", max: "400000" },
          { label: "Más de $400.000", min: "400000", max: undefined },
        ].map((range) => {
          const active =
            current.precio_min === range.min &&
            current.precio_max === range.max;
          return (
            <FilterOption
              key={range.label}
              label={range.label}
              active={active}
              onClick={() => {
                if (active) {
                  setFilter("precio_min", null);
                  setFilter("precio_max", null);
                } else {
                  const params = new URLSearchParams(searchParams.toString());
                  if (range.min) params.set("precio_min", range.min);
                  else params.delete("precio_min");
                  if (range.max) params.set("precio_max", range.max);
                  else params.delete("precio_max");
                  router.push(`${pathname}?${params.toString()}`);
                }
              }}
            />
          );
        })}
      </FilterGroup>
    </div>
  );
}

function FilterGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h4 className="text-[9px] tracking-[0.25em] uppercase text-[#766A63] font-[600] mb-3">
        {title}
      </h4>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function FilterOption({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "block w-full text-left text-xs py-1 transition-colors",
        active
          ? "text-[#1F1B19] font-[500]"
          : "text-[#766A63] hover:text-[#1F1B19]"
      )}
    >
      {active ? "→ " : ""}{label}
    </button>
  );
}
