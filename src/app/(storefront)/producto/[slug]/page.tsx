// El stock cambia desde el admin (ajuste manual) y desde el checkout; esta
// página nunca debe servirse desde caché o mostraría disponibilidad vieja.
export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { ProductGallery } from "@/components/storefront/ProductGallery";
import { VariantSelector } from "@/components/storefront/VariantSelector";
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

  const price = product.effective_price ?? product.base_price;
  const isOnSale = product.is_on_sale && product.compare_price;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

        {/* ── GALERÍA ── */}
        <ProductGallery images={product.images} name={product.name} />

        {/* ── DETALLE ── */}
        <div className="flex flex-col">
          {/* Breadcrumb colección */}
          {product.collections?.[0] && (
            <span className="text-[9px] tracking-[0.25em] uppercase text-[#A0647E] font-[500] mb-3">
              {product.collections[0].name}
            </span>
          )}

          {/* Nombre */}
          <h1
            className="text-3xl sm:text-4xl text-[#1E1B2E] leading-tight mb-4"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {product.name}
          </h1>

          {/* Precio */}
          <div className="flex items-baseline gap-3 mb-6">
            <span className="text-2xl text-[#1E1B2E] font-[500]">
              {formatCOP(price)}
            </span>
            {isOnSale && product.compare_price && (
              <>
                <span className="text-base text-[#6E6680] line-through">
                  {formatCOP(product.compare_price)}
                </span>
                <span className="text-xs bg-[#A0647E] text-white px-2 py-0.5 font-[500]">
                  -{discountPercent(product.compare_price, price)}%
                </span>
              </>
            )}
          </div>

          {/* Selector de variantes + Añadir al carrito */}
          <VariantSelector product={product} />

          {/* Separador */}
          <div className="border-t border-[#E9DDE3] my-6" />

          {/* Descripción */}
          {product.description && (
            <div className="mb-6">
              <h2 className="text-[10px] tracking-[0.2em] uppercase text-[#6E6680] font-[600] mb-3">
                Descripción
              </h2>
              <div className="space-y-3 text-sm text-[#1E1B2E] leading-relaxed font-[300]">
                {product.description.split(/\n\n+/).map((paragraph, i) => (
                  <p key={i}>
                    {paragraph.split("\n").map((line, j, arr) => (
                      <span key={j}>
                        {line}
                        {j < arr.length - 1 && <br />}
                      </span>
                    ))}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Cuidado de la prenda */}
          {product.care_instructions && (
            <div className="mb-6">
              <h2 className="text-[10px] tracking-[0.2em] uppercase text-[#6E6680] font-[600] mb-3">
                Cuidado de la prenda
              </h2>
              <div className="space-y-3 text-sm text-[#6E6680] leading-relaxed font-[300]">
                {product.care_instructions.split(/\n\n+/).map((paragraph, i) => (
                  <p key={i}>
                    {paragraph.split("\n").map((line, j, arr) => (
                      <span key={j}>
                        {line}
                        {j < arr.length - 1 && <br />}
                      </span>
                    ))}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Envío info */}
          <div className="bg-[#F2D4DC]/20 border border-[#E9DDE3] p-4 text-xs text-[#6E6680] leading-relaxed">
            <p>📦 Envío a todo Colombia. Tiempo estimado 3-5 días hábiles.</p>
            <p className="mt-1">🔒 Pago 100% seguro con Wompi.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
