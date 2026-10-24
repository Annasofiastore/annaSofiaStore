import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import type { Category } from "@/types";

/**
 * Barra de categorías del catálogo: botones grandes sobre los productos.
 * Conserva los demás filtros activos y reinicia la paginación.
 */
export function CatalogCategoryBar({
  categories,
  current,
}: {
  categories: Category[];
  current: Record<string, string | undefined>;
}) {
  if (categories.length === 0) return null;

  function hrefFor(slug: string | null) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(current)) {
      if (value && key !== "categoria" && key !== "pagina") params.set(key, value);
    }
    if (slug) params.set("categoria", slug);
    const qs = params.toString();
    return qs ? `/catalogo?${qs}` : "/catalogo";
  }

  const items = [{ id: "all", name: "Todas", slug: null as string | null }, ...categories];

  return (
    <nav
      aria-label="Categorías"
      className="mb-10 -mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <ul className="flex sm:flex-wrap sm:justify-center gap-2 sm:gap-3 w-max sm:w-auto mx-auto">
        {items.map((c) => {
          const active = c.slug ? current.categoria === c.slug : !current.categoria;
          return (
            <li key={c.id} className="shrink-0">
              <Link
                href={hrefFor(c.slug)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "block rounded-full border px-6 sm:px-8 py-2.5 sm:py-3 text-xs sm:text-[13px] tracking-[0.2em] uppercase font-[500] transition-colors",
                  active
                    ? "bg-[#221A33] border-[#221A33] text-[#F7F2EC]"
                    : "border-[#221A33]/30 text-[#221A33] hover:bg-[#F5DDE5] hover:border-[#F5DDE5]"
                )}
              >
                {c.name}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
