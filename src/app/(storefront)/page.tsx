export const dynamic = "force-dynamic";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { createServiceClient } from "@/lib/supabase/server";
import { ProductCard } from "@/components/storefront/ProductCard";
import { HeroSlider } from "@/components/storefront/HeroSlider";
import { ScrollReveal } from "@/components/storefront/ScrollReveal";
import { StaggeredGrid } from "@/components/storefront/StaggeredGrid";
import { MarqueeStrip } from "@/components/storefront/MarqueeStrip";
import type { Product } from "@/types";
import { getStoreName } from "@/lib/config/store-name";
import { getNosotrasContent } from "@/lib/config/nosotras";

type HeroSlide = { id: string; image_url: string; alt_text: string | null };

type FeaturedSection = {
  collectionName: string;
  collectionSlug: string | null;
  collectionDesc: string | null;
  products: Product[];
};

const BRAND_VALUES = [
  { num: "01", title: "Intencional", desc: "Con propósito detrás de cada costura. Cada prenda nace desde el amor." },
  { num: "02", title: "Versátil", desc: "De los días simples a los momentos especiales. Prendas que se adaptan a tu día a día." },
  { num: "03", title: "Femenina", desc: "Diseños que resaltan tu esencia. Delicadeza, confianza y estilo en cada detalle." },
  { num: "04", title: "Auténtica", desc: "Cada prenda refleja quién quieres ser." },
];

async function getHeroSlides(): Promise<HeroSlide[]> {
  const db = createServiceClient();
  const { data } = await db
    .from("hero_slides")
    .select("id, image_url, alt_text")
    .eq("is_active", true)
    .order("sort_order");
  return (data ?? []) as HeroSlide[];
}

async function getFeaturedSection(): Promise<FeaturedSection> {
  const db = createServiceClient();

  const { data: collection } = await db
    .from("collections")
    .select("id, name, slug, description")
    .eq("featured_on_home", true)
    .eq("is_active", true)
    .single();

  if (collection) {
    const { data: rows } = await db
      .from("product_collections")
      .select(`
        products (
          id, name, slug, base_price, compare_price, images,
          is_on_sale, effective_price, is_sold_out, is_pre_sale, status
        )
      `)
      .eq("collection_id", collection.id)
      .order("sort_order", { ascending: true })
      .limit(4);

    const products = (rows ?? [])
      .map((r: any) => r.products)
      .filter((p: any) => p?.status === "active") as Product[];

    return {
      collectionName: collection.name,
      collectionSlug: collection.slug,
      collectionDesc: collection.description,
      products,
    };
  }

  const { data } = await db
    .from("products")
    .select(`
      id, name, slug, base_price, compare_price, images,
      is_on_sale, effective_price, is_sold_out, is_pre_sale
    `)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(4);

  return {
    collectionName: "Nueva colección",
    collectionSlug: null,
    collectionDesc: null,
    products: (data ?? []) as Product[],
  };
}

export default async function HomePage() {
  const storeName = await getStoreName();
  const nosotras = await getNosotrasContent(storeName);
  // Iniciales para el texto decorativo: "AnnaSofia" → "AS"
  const monogram = storeName.match(/[A-ZÁÉÍÓÚÑ]/g)?.slice(0, 2).join("") || storeName.charAt(0);
  const [featured, heroSlides] = await Promise.all([
    getFeaturedSection(),
    getHeroSlides(),
  ]);

  const hasSlides = heroSlides.length > 0;

  return (
    <>
      {/* ── HERO ───────────────────────────────────────────────── */}
      <section
        className={`relative min-h-[92vh] flex items-center justify-center overflow-hidden ${
          hasSlides ? "bg-[#1E1B2E]" : "bg-[#FAF6F7]"
        }`}
      >
        {hasSlides ? (
          <HeroSlider slides={heroSlides} />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#FAF6F7] via-[#F2D4DC]/20 to-[#D9C3CE]/30" />
        )}

        <div className="relative z-10 text-center px-4 max-w-2xl mx-auto">
          <span
            className={`inline-block text-[10px] tracking-[0.3em] uppercase mb-6 font-[500] ${
              hasSlides ? "text-white/90" : "text-[#A0647E]"
            }`}
            style={hasSlides ? { textShadow: "0 1px 8px rgba(0,0,0,0.9), 0 2px 20px rgba(0,0,0,0.6)" } : undefined}
          >
            Nueva colección
          </span>

          <h1
            className="text-5xl sm:text-6xl md:text-7xl mb-4 leading-[1.05]"
            style={{
              fontFamily: "'Playfair Display', serif",
              fontStyle: "italic",
              color: hasSlides ? "#ffffff" : "#1E1B2E",
              ...(hasSlides && {
                textShadow:
                  "0 1px 3px rgba(0,0,0,0.95), 0 3px 20px rgba(0,0,0,0.75), 0 6px 50px rgba(0,0,0,0.5)",
              }),
            }}
          >
            {storeName}
          </h1>

          <p
            className={`text-base mb-10 leading-relaxed font-[300] ${
              hasSlides ? "text-white/90" : "text-[#6E6680]"
            }`}
            style={hasSlides ? { textShadow: "0 1px 6px rgba(0,0,0,0.9), 0 2px 20px rgba(0,0,0,0.6)" } : undefined}
          >
            Mujeres que visten con intención
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/catalogo"
              className={`inline-flex items-center gap-2 px-8 py-3 text-[11px] tracking-[0.2em] uppercase font-[500] transition-colors rounded-none ${
                hasSlides
                  ? "bg-white text-[#1E1B2E] hover:bg-[#FAF6F7]"
                  : "bg-[#1E1B2E] text-[#FAF6F7] hover:bg-[#34304A]"
              }`}
            >
              Ver catálogo <ArrowRight size={14} />
            </Link>
            <Link
              href="/colecciones"
              className={`inline-flex items-center gap-2 px-8 py-3 text-[11px] tracking-[0.2em] uppercase font-[500] transition-colors rounded-none ${
                hasSlides
                  ? "border border-white text-white hover:bg-white hover:text-[#1E1B2E]"
                  : "border border-[#1E1B2E] text-[#1E1B2E] hover:bg-[#1E1B2E] hover:text-[#FAF6F7]"
              }`}
            >
              Colecciones
            </Link>
          </div>
        </div>
      </section>

      {/* ── MARQUEE ────────────────────────────────────────────── */}
      <MarqueeStrip />

      {/* ── VALORES DE MARCA ───────────────────────────────────── */}
      <section className="bg-[#FAF6F7] border-b border-[#E9DDE3] py-16 overflow-hidden">
        <StaggeredGrid
          className="max-w-6xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center"
          itemDelay={120}
        >
          {BRAND_VALUES.map((v) => (
            <div key={v.title}>
              <h3
                className="text-lg text-[#1E1B2E] mb-2"
                style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic" }}
              >
                {v.title}
              </h3>
              <p className="text-xs text-[#6E6680] leading-relaxed">{v.desc}</p>
            </div>
          ))}
        </StaggeredGrid>
      </section>

      {/* ── COLECCIÓN DESTACADA ────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <ScrollReveal variant="fadeUp" className="flex items-end justify-between mb-12">
          <div>
            <span className="text-[10px] tracking-[0.25em] uppercase text-[#A0647E] font-[500]">
              Nueva colección
            </span>
            <h2
              className="text-4xl sm:text-5xl text-[#1E1B2E] mt-1"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {featured.collectionName}
            </h2>
            {featured.collectionDesc && (
              <p className="text-sm text-[#6E6680] leading-relaxed font-[300] mt-2 max-w-md">
                {featured.collectionDesc}
              </p>
            )}
          </div>
          <Link
            href={featured.collectionSlug ? `/coleccion/${featured.collectionSlug}` : "/catalogo"}
            className="hidden sm:inline-flex items-center gap-1.5 text-[11px] tracking-[0.15em] uppercase text-[#6E6680] hover:text-[#1E1B2E] transition-colors font-[500]"
          >
            Ver todo <ArrowRight size={12} />
          </Link>
        </ScrollReveal>

        {featured.products.length > 0 ? (
          <StaggeredGrid
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
            itemDelay={100}
          >
            {featured.products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </StaggeredGrid>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] bg-[#F2D4DC]/30 animate-pulse" />
            ))}
          </div>
        )}

        <div className="text-center mt-10 sm:hidden">
          <Link
            href={featured.collectionSlug ? `/coleccion/${featured.collectionSlug}` : "/catalogo"}
            className="inline-flex items-center gap-1.5 text-[11px] tracking-[0.15em] uppercase text-[#6E6680] hover:text-[#1E1B2E] transition-colors font-[500]"
          >
            Ver todo <ArrowRight size={12} />
          </Link>
        </div>
      </section>

      {/* ── MARQUEE CLARO ──────────────────────────────────────── */}
      <MarqueeStrip inverted />

      {/* ── BANNER NOSOTRAS ────────────────────────────────────── */}
      <section className="relative bg-[#1E1B2E] py-28 overflow-hidden">
        {/* Texto decorativo de fondo */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 flex items-center justify-center text-[18vw] font-[700] text-[#D29DB9]/[0.06] leading-none select-none"
          style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic" }}
        >
          {monogram}
        </span>

        <ScrollReveal variant="fadeUp" className="relative z-10 max-w-2xl mx-auto text-center px-4">
          <span className="text-[10px] tracking-[0.35em] uppercase text-[#A0647E] font-[500]">
            Nuestra historia
          </span>
          <h2
            className="text-5xl sm:text-6xl mt-3 mb-6 leading-tight"
            style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic", color: "#ffffff" }}
          >
            Nosotras
          </h2>
          <p className="text-sm text-[#D9C3CE] font-[300] leading-relaxed mb-8 max-w-sm mx-auto">
            {nosotras.summary}
          </p>
          <Link
            href="/nosotras"
            className="inline-flex items-center gap-2 px-8 py-3 border border-[#F2D4DC]/60 text-[#F2D4DC] text-[11px] tracking-[0.2em] uppercase font-[500] hover:bg-[#F2D4DC] hover:text-[#1E1B2E] transition-colors"
          >
            Conocernos <ArrowRight size={12} />
          </Link>
        </ScrollReveal>
      </section>

      {/* ── CTA WISHLIST ───────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        <ScrollReveal variant="scale" duration={800}>
          <span className="block text-[10px] tracking-[0.3em] uppercase text-[#A0647E] font-[500] mb-4">
            Tu lista de deseos
          </span>
          <h2
            className="text-4xl sm:text-5xl text-[#1E1B2E] mb-4"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Guarda tus favoritos
          </h2>
          <p className="text-sm text-[#6E6680] mb-10 font-[300] max-w-sm mx-auto leading-relaxed">
            Añade prendas a tu wishlist y te avisamos cuando baje el precio.
          </p>
          <Link
            href="/cuenta/wishlist"
            className="inline-flex items-center gap-2 px-10 py-3.5 bg-[#1E1B2E] text-[#FAF6F7] text-[11px] tracking-[0.2em] uppercase font-[500] hover:bg-[#34304A] transition-colors"
          >
            Ver wishlist <ArrowRight size={12} />
          </Link>
        </ScrollReveal>
      </section>
    </>
  );
}
