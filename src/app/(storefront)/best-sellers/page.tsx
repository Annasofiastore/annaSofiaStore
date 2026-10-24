export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, TrendingUp } from "lucide-react";
import { createServiceClient } from "@/lib/supabase/server";
import { ProductCard } from "@/components/storefront/ProductCard";
import type { Product } from "@/types";
import { getStoreName } from "@/lib/config/store-name";

export async function generateMetadata(): Promise<Metadata> {
  const storeName = await getStoreName();
  return {
    title: `Best Sellers — ${storeName}`,
    description: `Las prendas más amadas por nuestra comunidad. Selección curada por el equipo de ${storeName}.`,
  };
}

async function getBestSellers(): Promise<Product[]> {
  const db = createServiceClient();
  const { data } = await db
    .from("products")
    .select(`
      id, name, slug, base_price, compare_price, images,
      is_on_sale, effective_price, is_sold_out, is_best_seller, is_pre_sale
    `)
    .eq("status", "active")
    .eq("is_best_seller", true)
    .order("created_at", { ascending: false });

  return (data ?? []) as Product[];
}

export default async function BestSellersPage() {
  const storeName = await getStoreName();
  const products = await getBestSellers();

  return (
    <div className="min-h-screen bg-[#F7F2EC]">

      {/* ── HERO ── */}
      <section className="relative py-20 border-b border-[#E8DED4] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#F5DDE5]/20 to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-xl">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={14} className="text-[#A0526C]" strokeWidth={1.5} />
              <span className="text-[10px] tracking-[0.3em] uppercase text-[#A0526C] font-[500]">
                Lo más amado
              </span>
            </div>
            <h1
              className="text-5xl sm:text-6xl text-[#221A33] mb-4 leading-[1.08]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Best Sellers
            </h1>
            <p className="text-base text-[#766A63] leading-relaxed font-[300]">
              Las prendas que más eligen nuestras clientas. Una selección curada por el
              equipo de {storeName} — piezas que hablan por sí solas.
            </p>
          </div>
        </div>
      </section>

      {/* ── GRID ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {products.length > 0 ? (
          <>
            <p className="text-xs text-[#766A63] mb-8 tracking-wide">
              {products.length} {products.length === 1 ? "prenda seleccionada" : "prendas seleccionadas"}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-24">
            <p
              className="text-3xl text-[#DCCFC4] mb-4"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Próximamente
            </p>
            <p className="text-sm text-[#766A63] mb-8 font-[300]">
              Estamos preparando nuestra selección de favoritas. Mientras tanto, explora el catálogo completo.
            </p>
            <Link
              href="/catalogo"
              className="inline-flex items-center gap-2 text-[11px] tracking-[0.2em] uppercase text-[#221A33] border-b border-[#221A33] pb-0.5 hover:border-[#A0526C] hover:text-[#A0526C] transition-colors font-[500]"
            >
              Ver catálogo completo <ArrowRight size={12} />
            </Link>
          </div>
        )}
      </section>

      {/* ── CTA ── */}
      {products.length > 0 && (
        <section className="bg-[#F5DDE5]/25 border-t border-[#E8DED4] py-16 text-center">
          <span className="text-[10px] tracking-[0.3em] uppercase text-[#A0526C] font-[500]">
            Hay más donde elegir
          </span>
          <p
            className="text-2xl text-[#221A33] mt-2 mb-6"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Explora todo el catálogo
          </p>
          <Link
            href="/catalogo"
            className="inline-flex items-center gap-2 px-8 py-3 border border-[#221A33] text-[#221A33] text-[11px] tracking-[0.2em] uppercase font-[500] hover:bg-[#221A33] hover:text-[#F7F2EC] transition-colors rounded-full"
          >
            Ver todo <ArrowRight size={13} />
          </Link>
        </section>
      )}
    </div>
  );
}
