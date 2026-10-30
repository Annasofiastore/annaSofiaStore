// El stock cambia desde el admin (ajuste manual) y desde el checkout; el
// catálogo nunca debe servirse desde caché o marcaría "Agotado" con retraso.
export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { ProductCard } from "@/components/storefront/ProductCard";
import { CatalogCategoryBar } from "@/components/storefront/CatalogCategoryBar";
import { CatalogFilters } from "@/components/storefront/CatalogFilters";
import { CatalogMobileFilters } from "@/components/storefront/CatalogMobileFilters";
import { CatalogSortSelect } from "@/components/storefront/CatalogSortSelect";
import type { Metadata } from "next";
import type { Product } from "@/types";

export const metadata: Metadata = {
  title: "Catálogo",
  description: "Explora todas las prendas y filtra por categoría, colección, ocasión, talla y precio.",
};

interface SearchParams {
  categoria?: string;
  coleccion?: string;
  ocasion?: string;
  talla?: string;
  color?: string;
  precio_min?: string;
  precio_max?: string;
  orden?: string;
  q?: string;
  pagina?: string;
  [key: string]: string | undefined;
}

interface Props {
  searchParams: Promise<SearchParams>;
}

const NO_MATCH = ["00000000-0000-0000-0000-000000000000"];

async function getProducts(filters: SearchParams): Promise<Product[]> {
  const supabase = await createClient();

  let query = supabase
    .from("products")
    .select(`
      *,
      variants:product_variants(*),
      categories:product_categories(category:categories(*)),
      collections:product_collections(collection:collections(*)),
      occasions:product_occasions(occasion:occasions(*))
    `)
    .eq("status", "active");

  // Filtro por categoría
  if (filters.categoria) {
    const { data: cat } = await supabase
      .from("categories").select("id").eq("slug", filters.categoria).single();
    if (!cat) return [];
    const { data: rows } = await supabase
      .from("product_categories").select("product_id").eq("category_id", cat.id);
    const ids = rows?.map((r: any) => r.product_id) ?? [];
    query = query.in("id", ids.length ? ids : NO_MATCH);
  }

  // Filtro por colección
  if (filters.coleccion) {
    const { data: col } = await supabase
      .from("collections").select("id").eq("slug", filters.coleccion).single();
    if (!col) return [];
    const { data: rows } = await supabase
      .from("product_collections").select("product_id").eq("collection_id", col.id);
    const ids = rows?.map((r: any) => r.product_id) ?? [];
    query = query.in("id", ids.length ? ids : NO_MATCH);
  }

  // Filtro por ocasión
  if (filters.ocasion) {
    const { data: occ } = await supabase
      .from("occasions").select("id").eq("slug", filters.ocasion).single();
    if (!occ) return [];
    const { data: rows } = await supabase
      .from("product_occasions").select("product_id").eq("occasion_id", occ.id);
    const ids = rows?.map((r: any) => r.product_id) ?? [];
    query = query.in("id", ids.length ? ids : NO_MATCH);
  }

  // Filtro por talla (atributo JSONB en variantes)
  if (filters.talla) {
    const { data: variants } = await supabase
      .from("product_variants")
      .select("product_id")
      .filter("attributes->>talla", "eq", filters.talla);
    const ids = [...new Set((variants ?? []).map((v: any) => v.product_id))];
    query = query.in("id", ids.length ? ids : NO_MATCH);
  }

  if (filters.q) {
    query = query.ilike("name", `%${filters.q}%`);
  }

  if (filters.precio_min) {
    query = query.gte("base_price", Number(filters.precio_min));
  }
  if (filters.precio_max) {
    query = query.lte("base_price", Number(filters.precio_max));
  }

  switch (filters.orden) {
    case "precio_asc":
      query = query.order("base_price", { ascending: true });
      break;
    case "precio_desc":
      query = query.order("base_price", { ascending: false });
      break;
    default:
      query = query.order("created_at", { ascending: false });
  }

  const { data } = await query.limit(48);
  if (!data) return [];

  return data.map((p: any) => ({
    ...p,
    categories: p.categories?.map((r: any) => r.category) ?? [],
    collections: p.collections?.map((r: any) => r.collection) ?? [],
    occasions: p.occasions?.map((r: any) => r.occasion) ?? [],
    variants: p.variants ?? [],
    is_sold_out:
      !p.variants?.length ||
      p.variants.every((v: any) => v.stock - v.reserved <= 0),
    is_on_sale: !!p.compare_price && p.compare_price > p.base_price,
    effective_price: p.base_price,
  }));
}

async function getFilterOptions() {
  const supabase = await createClient();
  const [cats, cols, occs] = await Promise.all([
    supabase.from("categories").select("*").order("sort_order"),
    supabase.from("collections").select("*").eq("is_active", true).order("sort_order"),
    supabase.from("occasions").select("*").order("sort_order"),
  ]);
  return {
    categories: cats.data ?? [],
    collections: cols.data ?? [],
    occasions: occs.data ?? [],
  };
}

export default async function CatalogoPage({ searchParams }: Props) {
  const filters = await searchParams;
  const [products, filterOptions] = await Promise.all([
    getProducts(filters),
    getFilterOptions(),
  ]);

  // Qué está viendo la clienta: búsqueda y filtros aplicados, con nombres legibles (no los slugs)
  const nameOf = (list: { slug: string; name: string }[], slug?: string) =>
    slug ? list.find((item) => item.slug === slug)?.name ?? slug : null;
  const contextParts = [
    filters.q ? `Resultados para “${filters.q}”` : null,
    nameOf(filterOptions.categories, filters.categoria),
    nameOf(filterOptions.collections, filters.coleccion),
    nameOf(filterOptions.occasions, filters.ocasion),
    filters.talla ? `Talla ${filters.talla}` : null,
  ].filter(Boolean);
  const contextLabel = contextParts.length ? contextParts.join(" · ") : "Todas las prendas";

  return (
    <div className="px-4 sm:px-8 lg:px-12 py-10">
      {/* ENCABEZADO */}
      <div className="text-center mb-10">
        <span className="text-[10px] tracking-[0.3em] uppercase text-[#A0526C] font-[500]">
          {contextLabel}
        </span>
        <h1
          className="text-5xl text-[#221A33] mt-1"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Catálogo
        </h1>
      </div>

      <CatalogCategoryBar categories={filterOptions.categories} current={filters} />

      <div className="flex gap-8 xl:gap-12">
        {/* SIDEBAR FILTROS — solo desktop */}
        <aside className="hidden lg:block w-56 shrink-0">
          <Suspense fallback={<div className="space-y-8 animate-pulse"><div className="h-4 bg-[#E8DED4] rounded w-3/4"/><div className="h-4 bg-[#E8DED4] rounded w-1/2"/></div>}>
            <CatalogFilters
              categories={[]}
              collections={filterOptions.collections}
              occasions={filterOptions.occasions}
              current={filters}
            />
          </Suspense>
        </aside>

        {/* GRID DE PRODUCTOS */}
        {/* min-w-0: sin esto, un elemento ancho de la barra superior ensancha toda la página en celular */}
        <div className="flex-1 min-w-0">
          {/* Barra superior: resultados + orden + filtros móvil */}
          <div className="flex flex-wrap items-center justify-between mb-6 gap-x-2 gap-y-3">
            <div className="flex items-center gap-3">
              {/* Botón filtros solo en móvil */}
              <div className="lg:hidden">
                <Suspense fallback={null}>
                  <CatalogMobileFilters
                    categories={[]}
                    collections={filterOptions.collections}
                    occasions={filterOptions.occasions}
                    current={filters}
                    totalProducts={products.length}
                  />
                </Suspense>
              </div>
              <p className="text-sm text-[#766A63]">
                {products.length} {products.length === 1 ? "prenda" : "prendas"}
              </p>
            </div>
            <CatalogSortSelect current={filters.orden} />
          </div>

          {products.length === 0 ? (
            <div className="text-center py-24">
              <p
                className="text-2xl text-[#766A63]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Sin resultados
              </p>
              <p className="text-sm text-[#766A63] mt-2">
                Prueba con otros filtros o busca algo diferente.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-4 xl:gap-x-6 gap-y-10">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

