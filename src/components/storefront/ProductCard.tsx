"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import { formatCOP, discountPercent, monogramOf } from "@/lib/utils/format";
import { useWishlistStore } from "@/lib/store/wishlist";
import type { Product } from "@/types";
import { useStoreName } from "@/components/StoreNameProvider";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const storeName = useStoreName();
  const monogram = monogramOf(storeName);
  const { toggle, has } = useWishlistStore();
  const wishlisted = has(product.id);
  const [imgIdx, setImgIdx] = useState(0);
  const [imgError, setImgError] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const price = product.effective_price ?? product.base_price;
  const isOnSale = product.is_on_sale && product.compare_price;
  const isSoldOut = product.is_sold_out;

  return (
    <article className="group relative">
      {/* IMAGEN */}
      <Link href={`/producto/${product.slug}`} className="block">
        <div className="relative aspect-[3/4] overflow-hidden bg-[#F5DDE5]/20">
          {product.images.length > 0 && !imgError ? (
            <Image
              src={product.images[imgIdx]}
              alt={product.name}
              fill
              sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 25vw"
              className={cn(
                "object-cover transition-transform duration-500",
                "group-hover:scale-105",
                isSoldOut && "opacity-60"
              )}
              onMouseEnter={() => product.images.length > 1 && setImgIdx(1)}
              onMouseLeave={() => setImgIdx(0)}
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="absolute inset-0 bg-[#DCCFC4]/30 flex items-center justify-center">
              <span
                className="text-3xl text-[#766A63]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {monogram}
              </span>
            </div>
          )}

          {/* BADGES */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {product.is_pre_sale && (
              <span className="bg-[#F7F2EC] border border-[#221A33] text-[#221A33] text-[9px] tracking-[0.15em] uppercase px-2 py-0.5 font-[700]">
                ◈ Pre Orden
              </span>
            )}
            {product.is_best_seller && !isSoldOut && (
              <span className="bg-[#766A63] text-white text-[9px] tracking-[0.15em] uppercase px-2 py-0.5 font-[600]">
                ✦ Más vendido
              </span>
            )}
            {isSoldOut && (
              <span className="bg-[#221A33] text-[#F7F2EC] text-[9px] tracking-[0.15em] uppercase px-2 py-0.5 font-[500]">
                Agotado
              </span>
            )}
            {isOnSale && !isSoldOut && (
              <span className="bg-[#A0526C] text-white text-[9px] tracking-[0.15em] uppercase px-2 py-0.5 font-[500]">
                -{discountPercent(product.compare_price!, price)}%
              </span>
            )}
          </div>

          {/* WISHLIST */}
          <button
            onClick={(e) => {
              e.preventDefault();
              toggle(product.id);
              const adding = !has(product.id);
              setToast(adding ? "Añadido a favoritos" : "Quitado de favoritos");
              setTimeout(() => setToast(null), 2000);
            }}
            aria-label={wishlisted ? "Quitar de favoritos" : "Añadir a favoritos"}
            className={cn(
              "absolute top-3 right-3 p-1.5 rounded-full transition-all duration-200",
              "opacity-0 group-hover:opacity-100",
              wishlisted
                ? "opacity-100 text-[#A0526C]"
                : "text-[#766A63] bg-white/70 hover:text-[#A0526C]"
            )}
          >
            <Heart
              size={16}
              strokeWidth={1.5}
              fill={wishlisted ? "currentColor" : "none"}
            />
          </button>

          {/* TOAST WISHLIST */}
          {toast && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap bg-[#221A33] text-[#F7F2EC] text-[10px] tracking-[0.12em] uppercase px-3 py-1.5 pointer-events-none">
              {toast}
            </div>
          )}
        </div>
      </Link>

      {/* INFO */}
      <div className="mt-4 sm:mt-5 text-center">
        <Link href={`/producto/${product.slug}`}>
          <h3 className="text-[15px] sm:text-base text-[#221A33] font-[500] leading-snug hover:text-[#A0526C] transition-colors truncate">
            {product.name}
          </h3>
        </Link>

        <div className="flex items-baseline justify-center gap-2 mt-1.5">
          <span className="text-[15px] sm:text-base text-[#A0526C] font-[600]">
            {formatCOP(price)}
          </span>
          {isOnSale && product.compare_price && (
            <span className="text-[13px] text-[#766A63] line-through">
              {formatCOP(product.compare_price)}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
