export const dynamic = "force-dynamic";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ChevronDown } from "lucide-react";
import { createServiceClient } from "@/lib/supabase/server";
import { HeroSlider } from "@/components/storefront/HeroSlider";
import { ScrollReveal } from "@/components/storefront/ScrollReveal";
import { StaggeredGrid } from "@/components/storefront/StaggeredGrid";
import { NewArrivals } from "@/components/storefront/NewArrivals";
import { MarqueeStrip } from "@/components/storefront/MarqueeStrip";
import { CategoryRow, type CategoryTile } from "@/components/storefront/CategoryRow";
import { PaymentsBanner } from "@/components/storefront/PaymentsBanner";
import { InstagramBlock } from "@/components/storefront/InstagramBlock";
import type { Product } from "@/types";
import { getStoreName } from "@/lib/config/store-name";
import { getNosotrasContent } from "@/lib/config/nosotras";
import { whatsappUrl } from "@/lib/config/brand";
import { getHeroContent } from "@/lib/config/hero";

const HELP_LINKS = [
  { title: "Escríbenos por WhatsApp", desc: "Resolvemos tus dudas de tallas, envíos y disponibilidad.", href: whatsappUrl, external: true },
  { title: "Explora el catálogo", desc: "Todas las prendas disponibles, con filtros por categoría, colección y ocasión.", href: "/catalogo", external: false },
] as const;

type HeroSlide = { id: string; image_url: string; alt_text: string | null };

type CollectionTile = {
  id: string;
  name: string;
  slug: string;
  hero_url: string | null;
  featured_on_home: boolean | null;
};

type ArrivalProduct = Product & { occasionSlugs: string[] };

type OccasionRow = { name: string; slug: string; sort_order: number | null };
type RawProduct = Product & { product_occasions?: { occasions: OccasionRow | null }[] | null };

type NewArrivalsSection = {
  title: string;
  href: string;
  products: ArrivalProduct[];
  tabs: { slug: string; name: string }[];
};

const PRODUCT_FIELDS = `
  id, name, slug, base_price, compare_price, images, status,
  is_on_sale, effective_price, is_sold_out, is_pre_sale, is_best_seller,
  product_occasions ( occasions ( name, slug, sort_order ) )
`;

const ARRIVALS_LIMIT = 12;

async function getHeroSlides(): Promise<HeroSlide[]> {
  const db = createServiceClient();
  const { data } = await db
    .from("hero_slides")
    .select("id, image_url, alt_text")
    .eq("is_active", true)
    .order("sort_order");
  return (data ?? []) as HeroSlide[];
}

/** Categorías para la fila de acceso rápido (Vestidos, Sets, Enterizos…). */
async function getCategoryTiles(): Promise<CategoryTile[]> {
  const db = createServiceClient();
  const { data } = await db
    .from("categories")
    .select("id, name, slug, image_url")
    .order("sort_order")
    .limit(6);
  return (data ?? []) as CategoryTile[];
}

/** Colecciones activas para los recuadros; la destacada en el inicio va primero. */
async function getCollectionTiles(): Promise<CollectionTile[]> {
  const db = createServiceClient();
  const { data } = await db
    .from("collections")
    .select("id, name, slug, hero_url, featured_on_home")
    .eq("is_active", true)
    .order("featured_on_home", { ascending: false, nullsFirst: false })
    .order("sort_order");
  return (data ?? []) as CollectionTile[];
}

/**
 * Novedades: productos de la colección destacada si existe; si no, los últimos creados.
 * Las pestañas son las ocasiones presentes en esos productos.
 */
async function getNewArrivals(): Promise<NewArrivalsSection> {
  const db = createServiceClient();

  const { data: collection } = await db
    .from("collections")
    .select("id, name, slug")
    .eq("featured_on_home", true)
    .eq("is_active", true)
    .maybeSingle();

  let raw: RawProduct[];
  if (collection) {
    const { data: rows } = await db
      .from("product_collections")
      .select(`products ( ${PRODUCT_FIELDS} )`)
      .eq("collection_id", collection.id)
      .order("sort_order", { ascending: true })
      .limit(ARRIVALS_LIMIT);
    raw = ((rows ?? []) as unknown as { products: RawProduct | null }[])
      .map((r) => r.products)
      .filter((p): p is RawProduct => p?.status === "active");
  } else {
    const { data } = await db
      .from("products")
      .select(PRODUCT_FIELDS)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(ARRIVALS_LIMIT);
    raw = (data ?? []) as unknown as RawProduct[];
  }

  const tabsBySlug = new Map<string, OccasionRow>();
  const products = raw.map(({ product_occasions, ...p }) => {
    const occasions = (product_occasions ?? [])
      .map((po) => po.occasions)
      .filter((o): o is OccasionRow => !!o);
    occasions.forEach((o) => tabsBySlug.set(o.slug, o));
    return { ...p, occasionSlugs: occasions.map((o) => o.slug) };
  });

  return {
    title: collection?.name ?? "Lo nuevo",
    href: collection ? `/coleccion/${collection.slug}` : "/catalogo",
    products,
    tabs: [...tabsBySlug.values()]
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      .map(({ slug, name }) => ({ slug, name })),
  };
}

export default async function HomePage() {
  const storeName = await getStoreName();
  const [heroSlides, categories, collections, arrivals, nosotras, hero] = await Promise.all([
    getHeroSlides(),
    getCategoryTiles(),
    getCollectionTiles(),
    getNewArrivals(),
    getNosotrasContent(storeName),
    getHeroContent(storeName),
  ]);

  const hasSlides = heroSlides.length > 0;
  const tiles = collections.slice(0, 3);

  return (
    <>
      {/* ── HERO ───────────────────────────────────────────────── */}
      {/* -mt-16 sube el hero detrás de la barra de navegación transparente */}
      <section
        {...(hasSlides ? { "data-hero-dark": "" } : {})}
        className={`relative -mt-16 min-h-[75vh] flex items-end overflow-hidden ${
          hasSlides ? "bg-[#221A33]" : "bg-[#F7F2EC]"
        }`}
      >
        {hasSlides ? (
          <HeroSlider slides={heroSlides} />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#F7F2EC] via-[#F5DDE5]/20 to-[#DCCFC4]/30" />
        )}

        {/* Texto abajo a la izquierda, alineado con el contenido del resto de la página */}
        <div className="relative z-10 w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-16 sm:pb-20">
          <div
            className="max-w-2xl animate-hero-in"
            style={hasSlides ? { textShadow: "0 2px 18px rgba(34,26,51,0.45)" } : undefined}
          >
            {hero.eyebrow && (
              <span
                className={`block text-xs tracking-[0.3em] uppercase font-[500] mb-5 ${
                  hasSlides ? "text-[#F5DDE5]" : "text-[#A0526C]"
                }`}
              >
                {hero.eyebrow}
              </span>
            )}
            <h1
              className={`text-5xl sm:text-6xl lg:text-7xl leading-[1.05] ${hero.subtitle ? "mb-5" : "mb-9"} ${
                hasSlides ? "text-white" : "text-[#221A33]"
              }`}
              style={{ fontFamily: "var(--font-display)" }}
            >
              {hero.title}
            </h1>
            {hero.subtitle && (
              <p
                className={`text-base sm:text-lg leading-relaxed mb-9 max-w-lg ${
                  hasSlides ? "text-white/90" : "text-[#766A63]"
                }`}
              >
                {hero.subtitle}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
              <Link
                href="/catalogo"
                className={`inline-flex items-center gap-2 px-9 py-3.5 text-xs tracking-[0.2em] uppercase font-[600] transition-colors rounded-full ${
                  hasSlides
                    ? "bg-white text-[#221A33] hover:bg-[#F5DDE5]"
                    : "bg-[#221A33] text-[#F7F2EC] hover:bg-[#352A4B]"
                }`}
                style={{ textShadow: "none" }}
              >
                {hero.cta} <ArrowRight size={14} />
              </Link>
              <Link
                href="/colecciones"
                className={`inline-flex items-center gap-1.5 text-xs tracking-[0.2em] uppercase font-[500] border-b pb-1 transition-colors ${
                  hasSlides
                    ? "text-white border-white/60 hover:border-white"
                    : "text-[#221A33] border-[#221A33]/40 hover:border-[#221A33]"
                }`}
              >
                Ver colecciones <ArrowRight size={12} />
              </Link>
            </div>
          </div>
        </div>

        {/* Invitación a bajar */}
        <a
          href="#categorias"
          aria-label="Ver más"
          className={`hidden sm:flex absolute bottom-6 left-1/2 -translate-x-1/2 z-10 animate-float ${
            hasSlides ? "text-white/80" : "text-[#766A63]"
          }`}
        >
          <ChevronDown size={22} strokeWidth={1.5} />
        </a>
      </section>

      {/* ── CATEGORÍAS ─────────────────────────────────────────── */}
      <CategoryRow categories={categories} />

      {/* ── MEDIOS DE PAGO ─────────────────────────────────────── */}
      <PaymentsBanner />

      {/* ── COLECCIONES (ancho completo) ───────────────────────── */}
      {tiles.length > 0 && (
        <section className="px-2 pt-2">
          <StaggeredGrid
            className={`grid gap-2 ${tiles.length === 1 ? "" : tiles.length === 2 ? "sm:grid-cols-2" : "sm:grid-cols-3"}`}
            itemDelay={120}
          >
            {tiles.map((c) => (
              <Link
                key={c.id}
                href={`/coleccion/${c.slug}`}
                className="group relative block aspect-[4/3] overflow-hidden bg-[#221A33]"
              >
                {c.hero_url && (
                  <Image
                    src={c.hero_url}
                    alt={c.name}
                    fill
                    sizes="(max-width:640px) 100vw, 33vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                )}
                <div className="absolute inset-0 bg-[#221A33]/20 group-hover:bg-[#221A33]/30 transition-colors" />
                {/* Marco interior */}
                <div className="absolute inset-5 sm:inset-6 border border-white/80 flex items-center justify-center">
                  <span
                    className={`text-2xl sm:text-3xl text-center px-4 ${c.hero_url ? "text-white" : "text-[#E8B9C7]"}`}
                    style={{ fontFamily: "var(--font-display)", textShadow: c.hero_url ? "0 1px 12px rgba(0,0,0,0.5)" : undefined }}
                  >
                    {c.name}
                  </span>
                </div>
              </Link>
            ))}
          </StaggeredGrid>
          {collections.length > tiles.length && (
            <div className="text-center mt-6">
              <Link
                href="/colecciones"
                className="inline-flex items-center gap-1.5 text-[11px] tracking-[0.15em] uppercase text-[#766A63] hover:text-[#221A33] transition-colors"
              >
                Ver todas las colecciones <ArrowRight size={12} />
              </Link>
            </div>
          )}
        </section>
      )}

      {/* ── NOVEDADES ──────────────────────────────────────────── */}
      <section className="px-6 sm:px-10 lg:px-16 py-16 sm:py-20">
        <ScrollReveal variant="fadeUp">
          <NewArrivals {...arrivals} />
        </ScrollReveal>
      </section>

      {/* ── MARQUEE CLARO ──────────────────────────────────────── */}
      <MarqueeStrip inverted />

      {/* ── CONÓCENOS + AYUDA ──────────────────────────────────── */}
      <section className="bg-[#221A33] px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="max-w-[1376px] mx-auto grid md:grid-cols-[2fr_3fr] gap-12 md:gap-20 items-center">
          <ScrollReveal variant="fadeUp">
            <span className="text-xs tracking-[0.3em] uppercase text-[#E8B9C7] font-[500]">
              Conócenos
            </span>
            <h2 className="text-4xl sm:text-5xl text-[#F7F2EC] mt-4 mb-6" style={{ fontFamily: "var(--font-display)" }}>
              {nosotras.title}
            </h2>
            <p className="text-[15px] text-[#DCCFC4] leading-relaxed mb-10 max-w-md">
              {nosotras.summary}
            </p>
            <Link
              href="/nosotras"
              className="inline-flex items-center gap-2 px-8 py-3 border border-[#F7F2EC]/70 text-[#F7F2EC] text-xs tracking-[0.2em] uppercase font-[500] hover:bg-[#F7F2EC] hover:text-[#221A33] transition-colors rounded-full"
            >
              Nuestra historia <ArrowRight size={13} />
            </Link>
          </ScrollReveal>

          <StaggeredGrid className="grid sm:grid-cols-2 gap-3" itemDelay={100}>
            {HELP_LINKS.map(({ title, desc, href, external }) => (
              <Link
                key={title}
                href={href}
                {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className="group flex flex-col justify-between min-h-[150px] border border-[#F7F2EC]/20 rounded-lg p-6 hover:border-[#E8B9C7] hover:bg-[#F7F2EC]/5 transition-colors"
              >
                <div>
                  <h3 className="text-2xl text-[#F7F2EC]" style={{ fontFamily: "var(--font-display)" }}>
                    {title}
                  </h3>
                  <p className="text-sm text-[#DCCFC4] leading-relaxed mt-2">{desc}</p>
                </div>
                <span className="inline-flex items-center gap-1.5 text-[11px] tracking-[0.2em] uppercase text-[#E8B9C7] mt-5">
                  Ver <ArrowRight size={12} className="transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </StaggeredGrid>
        </div>
      </section>

      <InstagramBlock />

      {/* ── CTA WISHLIST ───────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        <ScrollReveal variant="scale" duration={800}>
          <span className="block text-[10px] tracking-[0.3em] uppercase text-[#A0526C] font-[500] mb-4">
            Tu lista de deseos
          </span>
          <h2
            className="text-4xl sm:text-5xl text-[#221A33] mb-4"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Guarda tus favoritos
          </h2>
          <p className="text-sm text-[#766A63] mb-10 font-[300] max-w-sm mx-auto leading-relaxed">
            Añade prendas a tu wishlist y te avisamos cuando baje el precio.
          </p>
          <Link
            href="/cuenta/wishlist"
            className="inline-flex items-center gap-2 px-10 py-3.5 bg-[#221A33] text-[#F7F2EC] text-[11px] tracking-[0.2em] uppercase font-[500] hover:bg-[#352A4B] transition-colors rounded-full"
          >
            Ver wishlist <ArrowRight size={12} />
          </Link>
        </ScrollReveal>
      </section>
    </>
  );
}
