"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { ProductCard } from "@/components/storefront/ProductCard";
import type { Product } from "@/types";

type Tab = { slug: string; name: string };

/** Carrusel de productos con pestañas por ocasión (estilo "New Arrivals"). */
export function NewArrivals({
  title,
  href,
  products,
  tabs,
}: {
  title: string;
  href: string;
  products: (Product & { occasionSlugs: string[] })[];
  tabs: Tab[];
}) {
  const [active, setActive] = useState<string | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const visible = useMemo(
    () => (active ? products.filter((p) => p.occasionSlugs.includes(active)) : products),
    [active, products]
  );

  function select(slug: string | null) {
    setActive(slug);
    trackRef.current?.scrollTo({ left: 0 });
  }

  function scroll(dir: 1 | -1) {
    const el = trackRef.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  }

  const allTabs: (Tab | { slug: null; name: string })[] = [{ slug: null, name: "Todo" }, ...tabs];

  return (
    <div>
      {/* Encabezado: título y pestañas a la izquierda; flechas y "Ver todo" a la derecha */}
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-5 mb-8 sm:mb-10">
        <div className="min-w-0">
          <h2 className="text-4xl sm:text-5xl text-[#1E1B2E]" style={{ fontFamily: "var(--font-display)" }}>
            {title}
          </h2>
          {tabs.length > 0 && (
            <ul className="flex gap-2 sm:gap-6 mt-5 overflow-x-auto pb-1">
              {allTabs.map((t) => (
                <li key={t.slug ?? "all"} className="shrink-0">
                  <button
                    onClick={() => select(t.slug)}
                    className={cn(
                      "text-xs tracking-[0.2em] uppercase font-[500] transition-colors",
                      "px-3 py-1.5 border sm:px-0 sm:py-1 sm:border-0 sm:border-b",
                      active === t.slug
                        ? "text-[#A0647E] border-[#A0647E]"
                        : "text-[#1E1B2E] border-[#E9DDE3] sm:border-transparent hover:text-[#A0647E]"
                    )}
                  >
                    {t.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex items-center gap-5">
          {visible.length > 4 && (
            <div className="hidden sm:flex items-center gap-2">
              {([-1, 1] as const).map((dir) => (
                <button
                  key={dir}
                  onClick={() => scroll(dir)}
                  aria-label={dir === 1 ? "Siguientes" : "Anteriores"}
                  className="w-9 h-9 rounded-full border border-[#E9DDE3] text-[#1E1B2E] flex items-center justify-center hover:border-[#A0647E] hover:text-[#A0647E] transition-colors"
                >
                  {dir === 1 ? <ArrowRight size={14} /> : <ArrowLeft size={14} />}
                </button>
              ))}
            </div>
          )}
          <Link
            href={href}
            className="inline-flex items-center gap-1.5 text-xs tracking-[0.15em] uppercase text-[#6E6680] hover:text-[#1E1B2E] transition-colors"
          >
            Ver todo <ArrowRight size={12} />
          </Link>
        </div>
      </div>

      {/* Carrusel: 2 por fila en celular, 3 en tablet, 4 en escritorio */}
      {visible.length > 0 ? (
        <div
          ref={trackRef}
          className="flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {visible.map((product) => (
            <div
              key={product.id}
              className="snap-start shrink-0 w-[calc((100%-1rem)/2)] sm:w-[calc((100%-2rem)/3)] lg:w-[calc((100%-3rem)/4)]"
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      ) : (
        <p className="py-16 text-center text-sm text-[#6E6680]">Pronto tendremos novedades aquí.</p>
      )}
    </div>
  );
}
