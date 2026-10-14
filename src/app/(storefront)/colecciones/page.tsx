import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getStoreName } from "@/lib/config/store-name";

export async function generateMetadata(): Promise<Metadata> {
  const storeName = await getStoreName();
  return {
    title: `Colecciones — ${storeName}`,
    description: `Explora todas las colecciones de ${storeName}.`,
  };
}

export default async function ColeccionesPage() {
  const storeName = await getStoreName();
  const supabase = await createClient();

  const { data: collections } = await supabase
    .from("collections")
    .select("id, name, slug, description, hero_url")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  const items = collections ?? [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Encabezado */}
      <div className="text-center mb-14">
        <span className="text-[10px] tracking-[0.3em] uppercase text-[#A0647E] font-[500]">
          {storeName}
        </span>
        <h1
          className="text-5xl text-[#1E1B2E] mt-1"
          style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic" }}
        >
          Colecciones
        </h1>
        <p className="text-sm text-[#6E6680] mt-4 max-w-md mx-auto">
          Cada colección es un universo de estilo pensado para la mujer que vive el mar con elegancia.
        </p>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-24">
          <p
            className="text-2xl text-[#6E6680]"
            style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic" }}
          >
            Próximamente
          </p>
          <p className="text-sm text-[#6E6680] mt-2">
            Estamos preparando nuestras colecciones. Vuelve pronto.
          </p>
          <Link
            href="/catalogo"
            className="inline-block mt-6 text-[11px] tracking-[0.2em] uppercase font-[500] text-[#1E1B2E] border border-[#1E1B2E] px-8 py-3 hover:bg-[#1E1B2E] hover:text-[#FAF6F7] transition-colors"
          >
            Ver catálogo completo
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((col) => (
            <Link
              key={col.id}
              href={`/coleccion/${col.slug}`}
              className="group block relative overflow-hidden"
            >
              {/* Imagen / fondo */}
              <div className="aspect-[3/4] relative overflow-hidden bg-[#F2D4DC]/30">
                {col.hero_url ? (
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                    style={{ backgroundImage: `url(${col.hero_url})` }}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-end justify-start p-0">
                    {/* Gradiente decorativo cuando no hay imagen */}
                    <div className="absolute inset-0 bg-gradient-to-br from-[#F2D4DC]/60 via-[#FAF6F7] to-[#E9DDE3]/60" />
                    <span
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-4xl text-[#1E1B2E]/20 select-none"
                      style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic" }}
                    >
                      MB
                    </span>
                  </div>
                )}

                {/* Overlay oscuro al hover */}
                <div className="absolute inset-0 bg-[#1E1B2E]/0 group-hover:bg-[#1E1B2E]/25 transition-colors duration-500" />

                {/* Texto sobre imagen */}
                <div className="absolute inset-0 flex flex-col justify-end p-6">
                  <div className="translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                    <h2
                      className="text-2xl text-white drop-shadow-md leading-tight"
                      style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic" }}
                    >
                      {col.name}
                    </h2>
                    {col.description && (
                      <p className="text-xs text-white/80 mt-1 line-clamp-2 drop-shadow opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        {col.description}
                      </p>
                    )}
                    <span className="inline-block mt-3 text-[10px] tracking-[0.2em] uppercase text-white/90 font-[500] opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      Ver colección →
                    </span>
                  </div>
                </div>
              </div>

              {/* Texto debajo (cuando no hay imagen de fondo legible) */}
              {!col.hero_url && (
                <div className="pt-4 pb-2">
                  <h2
                    className="text-xl text-[#1E1B2E]"
                    style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic" }}
                  >
                    {col.name}
                  </h2>
                  {col.description && (
                    <p className="text-xs text-[#6E6680] mt-1 line-clamp-2">{col.description}</p>
                  )}
                  <span className="text-[10px] tracking-[0.2em] uppercase text-[#A0647E] font-[500] mt-2 inline-block">
                    Ver colección →
                  </span>
                </div>
              )}
            </Link>
          ))}
        </div>
      )}

      {/* CTA catálogo completo */}
      {items.length > 0 && (
        <div className="text-center mt-16">
          <Link
            href="/catalogo"
            className="inline-block text-[11px] tracking-[0.2em] uppercase font-[500] text-[#6E6680] border border-[#E9DDE3] px-8 py-3 hover:border-[#1E1B2E] hover:text-[#1E1B2E] transition-colors"
          >
            Ver catálogo completo
          </Link>
        </div>
      )}
    </div>
  );
}
