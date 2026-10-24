import Link from "next/link";
import Image from "next/image";
import { StaggeredGrid } from "@/components/storefront/StaggeredGrid";

export type CategoryTile = {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
};

/**
 * Cuadrícula y proporción según cuántas categorías haya, para que la fila
 * se vea completa con 1 a 6 (lo normal son 3 o 4).
 * Las clases van completas para que Tailwind las detecte.
 */
function layoutFor(count: number) {
  switch (count) {
    case 1:
      return { grid: "grid-cols-1", aspect: "aspect-[4/5] sm:aspect-[16/7]", big: true };
    case 2:
      return { grid: "grid-cols-2", aspect: "aspect-[3/4] sm:aspect-[4/3]", big: true };
    case 3:
      // En móvil la primera ocupa todo el ancho y las otras dos van lado a lado
      return { grid: "grid-cols-2 sm:grid-cols-3", aspect: "aspect-[3/4] sm:aspect-[4/5]", big: true };
    case 4:
      return { grid: "grid-cols-2 lg:grid-cols-4", aspect: "aspect-[3/4] lg:aspect-[4/5]", big: true };
    case 5:
      return { grid: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5", aspect: "aspect-[2/3]", big: false };
    default:
      return { grid: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6", aspect: "aspect-[2/3]", big: false };
  }
}

/** Fila de categorías: tarjetas con foto oscurecida, nombre en mayúsculas y botón "Comprar". */
export function CategoryRow({ categories }: { categories: CategoryTile[] }) {
  if (categories.length === 0) return null;

  const { grid, aspect, big } = layoutFor(categories.length);
  const firstSpansOnMobile = categories.length === 3;

  return (
    <section id="categorias" className="px-1.5 pt-1.5 scroll-mt-16">
      <StaggeredGrid
        className={`grid ${grid} gap-1.5`}
        itemDelay={80}
        firstItemClassName={firstSpansOnMobile ? "col-span-2 sm:col-span-1" : undefined}
      >
        {categories.map((c, i) => (
          <Link
            key={c.id}
            href={`/catalogo?categoria=${c.slug}`}
            className={`group relative block overflow-hidden rounded-lg bg-[#766A63] ${
              firstSpansOnMobile && i === 0 ? "aspect-[4/3] sm:aspect-[4/5]" : aspect
            }`}
          >
            {c.image_url && (
              <Image
                src={c.image_url}
                alt={c.name}
                fill
                sizes="(max-width:640px) 50vw, 33vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
            )}
            <div className="absolute inset-0 bg-black/35 group-hover:bg-black/25 transition-colors" />
            <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-4 px-2 pb-8 sm:pb-10">
              <span
                className={`font-[300] uppercase tracking-[0.08em] text-white text-center leading-tight ${
                  big ? "text-2xl sm:text-3xl lg:text-4xl" : "text-xl sm:text-2xl lg:text-[26px]"
                }`}
              >
                {c.name}
              </span>
              <span className="border border-white/70 px-5 py-1.5 text-[11px] sm:text-xs uppercase tracking-[0.15em] text-white group-hover:bg-white group-hover:text-[#221A33] transition-colors">
                Comprar
              </span>
            </div>
          </Link>
        ))}
      </StaggeredGrid>
    </section>
  );
}
