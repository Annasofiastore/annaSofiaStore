"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, ShoppingBag, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useWishlistStore } from "@/lib/store/wishlist";
import { formatCOP } from "@/lib/utils/format";

type ProductPreview = {
  id: string;
  name: string;
  slug: string;
  base_price: number;
  compare_price: number | null;
  images: string[];
  status: string;
  is_sold_out: boolean;
};

export default function WishlistPage() {
  const { productIds, toggle } = useWishlistStore();
  const [products, setProducts] = useState<ProductPreview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (productIds.length === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }

    const supabase = createClient();
    supabase
      .from("products")
      .select("id, name, slug, base_price, compare_price, images, status, is_sold_out")
      .in("id", productIds)
      .then(({ data }) => {
        // Mantener el orden del wishlist store
        const map = new Map((data ?? []).map((p) => [p.id, p]));
        setProducts(
          productIds
            .map((id) => map.get(id))
            .filter(Boolean) as ProductPreview[]
        );
        setLoading(false);
      });
  }, [productIds]);

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 bg-white border border-[#E8DED4] animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <h2
        className="text-xl text-[#1C1B2E] mb-5"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Wishlist
      </h2>

      {products.length === 0 ? (
        <div className="bg-white border border-[#E8DED4] py-16 text-center">
          <Heart size={40} className="mx-auto mb-4 text-[#DCCFC4]" />
          <p className="text-sm text-[#766A63] mb-4">Tu wishlist está vacía.</p>
          <Link
            href="/catalogo"
            className="inline-block text-[11px] uppercase tracking-[0.15em] text-[#1C1B2E] border-b border-[#1C1B2E] pb-0.5"
          >
            Explorar catálogo
          </Link>
        </div>
      ) : (
        <div className="space-y-2.5">
          {products.map((p) => {
            const img = p.images?.[0];
            const isAvailable = p.status === "active" && !p.is_sold_out;

            return (
              <div
                key={p.id}
                className="bg-white border border-[#E8DED4] flex items-center gap-4 p-4"
              >
                {/* Imagen */}
                <div className="w-16 h-20 shrink-0 overflow-hidden bg-[#F7F2EC] relative">
                  {img ? (
                    <Image
                      src={img}
                      alt={p.name}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#F5DDE5]/30" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/producto/${p.slug}`}
                    className="text-sm font-[500] text-[#1C1B2E] hover:text-[#A0526C] transition-colors line-clamp-2 block"
                  >
                    {p.name}
                  </Link>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm font-[600] text-[#1C1B2E]">
                      {formatCOP(p.base_price)}
                    </span>
                    {p.compare_price && p.compare_price > p.base_price && (
                      <span className="text-xs text-[#766A63] line-through">
                        {formatCOP(p.compare_price)}
                      </span>
                    )}
                  </div>
                  {!isAvailable && (
                    <span className="text-[10px] uppercase tracking-wide text-[#A0526C] font-[500] mt-1 block">
                      Agotado
                    </span>
                  )}
                </div>

                {/* Acciones */}
                <div className="flex flex-col items-center gap-2 shrink-0">
                  {isAvailable && (
                    <Link
                      href={`/producto/${p.slug}`}
                      className="inline-flex items-center gap-1 px-3 py-2 bg-[#1C1B2E] text-[#F7F2EC] text-[10px] uppercase tracking-[0.12em] font-[500] hover:bg-[#A0526C] transition-colors rounded-full"
                    >
                      <ShoppingBag size={11} /> Ver
                    </Link>
                  )}
                  <button
                    onClick={() => toggle(p.id)}
                    title="Eliminar de wishlist"
                    className="p-1.5 text-[#DCCFC4] hover:text-[#A0526C] transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
