export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Tag } from "lucide-react";
import { createServiceClient } from "@/lib/supabase/server";
import { ProductCard } from "@/components/storefront/ProductCard";
import type { Product } from "@/types";

export const metadata: Metadata = {
  title: "Sale",
  description: "Prendas con descuento por tiempo limitado.",
};

async function getSaleProducts(): Promise<Product[]> {
  const db = createServiceClient();
  const { data } = await db
    .from("products")
    .select(`
      id, name, slug, base_price, compare_price, images,
      is_on_sale, effective_price, is_sold_out, is_best_seller, is_pre_sale
    `)
    .eq("status", "active")
    .eq("is_on_sale", true)
    .order("created_at", { ascending: false });

  return (data ?? []) as Product[];
}

export default async function SalePage() {
  const products = await getSaleProducts();

  return (
    <div className="min-h-screen bg-[#F7F2EC]">
      <section className="relative py-20 border-b border-[#E8DED4] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#F5DDE5]/20 to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-xl">
            <div className="flex items-center gap-2 mb-4">
              <Tag size={14} className="text-[#A0526C]" strokeWidth={1.5} />
              <span className="text-[10px] tracking-[0.3em] uppercase text-[#A0526C] font-[500]">
                Precios especiales
              </span>
            </div>
            <h1
              className="text-5xl sm:text-6xl text-[#221A33] mb-4 leading-[1.08]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Sale
            </h1>
            <p className="text-base text-[#766A63] leading-relaxed font-[300]">
              Prendas con descuento por tiempo limitado. Hasta agotar existencias.
            </p>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {products.length > 0 ? (
          <>
            <p className="text-xs text-[#766A63] mb-8 tracking-wide">
              {products.length} {products.length === 1 ? "prenda en descuento" : "prendas en descuento"}
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
              Sin descuentos por ahora
            </p>
            <p className="text-sm text-[#766A63] mb-8 font-[300]">
              Vuelve pronto: publicamos nuevas ofertas con frecuencia.
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
    </div>
  );
}
