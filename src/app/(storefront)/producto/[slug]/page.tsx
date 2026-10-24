// El stock cambia desde el admin (ajuste manual) y desde el checkout; esta
// página nunca debe servirse desde caché o mostraría disponibilidad vieja.
export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronDown, ChevronRight, Truck, ShieldCheck, RotateCcw } from "lucide-react";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { ProductGallery } from "@/components/storefront/ProductGallery";
import { VariantSelector } from "@/components/storefront/VariantSelector";
import { NewArrivals } from "@/components/storefront/NewArrivals";
import { formatCOP, discountPercent } from "@/lib/utils/format";
import type { Product } from "@/types";

interface Props {
  params: Promise<{ slug: string }>;
}

async function getProduct(slug: string): Promise<Product | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select(`
      *,
      variants:product_variants(*),
      categories:product_categories(category:categories(*)),
      collections:product_collections(collection:collections(*))
    `)
    .eq("slug", slug)
    .eq("status", "active")
    .single();

  if (!data) return null;

  const variants = data.variants ?? [];
  return {
    ...data,
    categories: data.categories?.map((r: any) => r.category) ?? [],
    collections: data.collections?.map((r: any) => r.collection) ?? [],
    variants: variants.map((v: any) => ({
      ...v,
      available_stock: Math.max(0, v.stock - v.reserved),
    })),
    is_sold_out: variants.every((v: any) => v.stock - v.reserved <= 0),
    is_on_sale: !!data.compare_price && data.compare_price > data.base_price,
    effective_price: data.base_price,
  };
}

/** Código hex de cada color, indexado por nombre en minúsculas (value y display_name). */
async function getColorHex(): Promise<Record<string, string>> {
  const { data } = await createServiceClient()
    .from("variant_attribute_values")
    .select("value, display_name, hex_color, variant_attributes!inner(name)")
    .eq("variant_attributes.name", "color")
    .not("hex_color", "is", null);
  const map: Record<string, string> = {};
  for (const row of data ?? []) {
    if (!row.hex_color) continue;
    map[row.value.toLowerCase()] = row.hex_color;
    if (row.display_name) map[row.display_name.toLowerCase()] = row.hex_color;
  }
  return map;
}

const RELATED_FIELDS = `
  id, name, slug, base_price, compare_price, images, status,
  is_on_sale, effective_price, is_sold_out, is_pre_sale, is_best_seller
`;

/** Productos de la misma colección; si no alcanzan, los más recientes. */
async function getRelated(product: Product): Promise<Product[]> {
  const db = createServiceClient();
  const limit = 8;
  let related: Product[] = [];

  const collectionId = product.collections?.[0]?.id;
  if (collectionId) {
    const { data } = await db
      .from("product_collections")
      .select(`products ( ${RELATED_FIELDS} )`)
      .eq("collection_id", collectionId)
      .order("sort_order", { ascending: true })
      .limit(limit + 1);
    related = ((data ?? []) as unknown as { products: Product | null }[])
      .map((r) => r.products)
      .filter((p): p is Product => !!p && p.status === "active" && p.id !== product.id);
  }

  if (related.length < 4) {
    const { data } = await db
      .from("products")
      .select(RELATED_FIELDS)
      .eq("status", "active")
      .neq("id", product.id)
      .order("created_at", { ascending: false })
      .limit(limit);
    const seen = new Set(related.map((p) => p.id));
    related = [...related, ...((data ?? []) as Product[]).filter((p) => !seen.has(p.id))];
  }

  return related.slice(0, limit);
}

function Paragraphs({ text }: { text: string }) {
  return (
    <>
      {text.split(/\n\n+/).map((paragraph, i) => (
        <p key={i}>
          {paragraph.split("\n").map((line, j, arr) => (
            <span key={j}>
              {line}
              {j < arr.length - 1 && <br />}
            </span>
          ))}
        </p>
      ))}
    </>
  );
}

/** Sección desplegable (nativa, sin JavaScript). */
function Accordion({ title, open = false, children }: { title: string; open?: boolean; children: React.ReactNode }) {
  return (
    <details open={open} className="group border-b border-[#E8DED4]">
      <summary className="flex items-center justify-between py-4 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
        <span className="text-xs tracking-[0.2em] uppercase text-[#221A33] font-[600]">{title}</span>
        <ChevronDown size={16} strokeWidth={1.5} className="text-[#766A63] transition-transform group-open:rotate-180" />
      </summary>
      <div className="pb-5 space-y-3 text-sm text-[#766A63] leading-relaxed">{children}</div>
    </details>
  );
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return {};
  return {
    title: product.name,
    description: product.description ?? undefined,
    openGraph: {
      images: product.images[0] ? [product.images[0]] : [],
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const [colorHex, related] = await Promise.all([getColorHex(), getRelated(product)]);

  const price = product.effective_price ?? product.base_price;
  const isOnSale = product.is_on_sale && product.compare_price;
  const collection = product.collections?.[0];

  return (
    <>
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 lg:pt-8 pb-16">
        {/* Ruta de navegación */}
        <nav aria-label="Ruta" className="flex items-center gap-1.5 text-xs text-[#766A63] mb-6 min-w-0">
          <Link href="/" className="hover:text-[#221A33] transition-colors shrink-0">Inicio</Link>
          <ChevronRight size={12} className="shrink-0" />
          {collection ? (
            <Link href={`/coleccion/${collection.slug}`} className="hover:text-[#221A33] transition-colors shrink-0">
              {collection.name}
            </Link>
          ) : (
            <Link href="/catalogo" className="hover:text-[#221A33] transition-colors shrink-0">Catálogo</Link>
          )}
          <ChevronRight size={12} className="shrink-0" />
          <span className="text-[#221A33] truncate">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] gap-8 lg:gap-16">
          {/* ── GALERÍA ── */}
          <ProductGallery images={product.images} name={product.name} />

          {/* ── DETALLE (fijo al hacer scroll en escritorio) ── */}
          <div className="lg:sticky lg:top-24 self-start">
            {collection && (
              <span className="block text-xs tracking-[0.25em] uppercase text-[#A0526C] font-[500] mb-3">
                {collection.name}
              </span>
            )}

            <h1
              className="text-3xl sm:text-4xl lg:text-[44px] text-[#221A33] leading-tight mb-4"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {product.name}
            </h1>

            <div className="flex items-baseline gap-3 mb-8">
              <span className="text-2xl text-[#A0526C] font-[600]">{formatCOP(price)}</span>
              {isOnSale && product.compare_price && (
                <>
                  <span className="text-base text-[#766A63] line-through">{formatCOP(product.compare_price)}</span>
                  <span className="text-xs bg-[#A0526C] text-white px-2.5 py-0.5 rounded-full font-[500]">
                    -{discountPercent(product.compare_price, price)}%
                  </span>
                </>
              )}
            </div>

            <VariantSelector product={product} colorHex={colorHex} />

            <div className="mt-8 border-t border-[#E8DED4]">
              {product.description && (
                <Accordion title="Descripción" open>
                  <div className="text-[#221A33] space-y-3"><Paragraphs text={product.description} /></div>
                </Accordion>
              )}
              {product.care_instructions && (
                <Accordion title="Cuidado de la prenda">
                  <Paragraphs text={product.care_instructions} />
                </Accordion>
              )}
              <Accordion title="Envíos y cambios" open={!product.description}>
                <p className="flex gap-3">
                  <Truck size={16} strokeWidth={1.5} className="shrink-0 mt-0.5 text-[#A0526C]" />
                  Envío a todo Colombia. Tiempo estimado 3–5 días hábiles.
                </p>
                <p className="flex gap-3">
                  <ShieldCheck size={16} strokeWidth={1.5} className="shrink-0 mt-0.5 text-[#A0526C]" />
                  Pago 100% seguro con Wompi.
                </p>
                <p className="flex gap-3">
                  <RotateCcw size={16} strokeWidth={1.5} className="shrink-0 mt-0.5 text-[#A0526C]" />
                  <span>
                    Consulta nuestra{" "}
                    <Link href="/devoluciones" className="underline underline-offset-2 text-[#221A33]">
                      política de cambios y devoluciones
                    </Link>
                    .
                  </span>
                </p>
              </Accordion>
            </div>
          </div>
        </div>
      </div>

      {/* ── TAMBIÉN TE PUEDE GUSTAR ── */}
      {related.length > 0 && (
        <section className="border-t border-[#E8DED4]">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
            <NewArrivals
              title="También te puede gustar"
              href={collection ? `/coleccion/${collection.slug}` : "/catalogo"}
              products={related.map((p) => ({ ...p, occasionSlugs: [] }))}
              tabs={[]}
            />
          </div>
        </section>
      )}
    </>
  );
}
