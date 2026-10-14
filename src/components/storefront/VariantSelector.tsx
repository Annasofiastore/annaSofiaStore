"use client";

import { useState } from "react";
import Image from "next/image";
import { Heart, ShoppingBag, AlertCircle, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useCartStore } from "@/lib/store/cart";
import type { Product, ProductVariant } from "@/types";
import { useStoreName } from "@/components/StoreNameProvider";

interface Props {
  product: Product;
}

export function VariantSelector({ product }: Props) {
  const storeName = useStoreName();
  const { variants = [] } = product;

  // Extraer valores únicos de talla y color
  const sizes = [
    ...new Set(
      variants
        .map((v) => v.attributes.talla)
        .filter(Boolean) as string[]
    ),
  ];
  const colors = [
    ...new Set(
      variants
        .map((v) => v.attributes.color)
        .filter(Boolean) as string[]
    ),
  ];

  const [selectedSize, setSelectedSize] = useState<string | null>(
    sizes.length === 1 ? sizes[0] : null
  );
  const [selectedColor, setSelectedColor] = useState<string | null>(
    colors.length === 1 ? colors[0] : null
  );
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [feedback, setFeedback] = useState<"ok" | "error" | null>(null);
  const [showSizeGuide, setShowSizeGuide] = useState(false);

  const addItem = useCartStore((s) => s.addItem);

  // Encontrar variante que coincide con selección
  const selectedVariant: ProductVariant | undefined = variants.find((v) => {
    const sizeMatch = !sizes.length || v.attributes.talla === selectedSize;
    const colorMatch = !colors.length || v.attributes.color === selectedColor;
    return sizeMatch && colorMatch;
  });

  const available = selectedVariant
    ? selectedVariant.available_stock ?? selectedVariant.stock - selectedVariant.reserved
    : 0;

  const isSoldOut = product.is_sold_out;
  const canAddToCart =
    !isSoldOut &&
    selectedVariant &&
    available > 0 &&
    (!sizes.length || selectedSize) &&
    (!colors.length || selectedColor);

  // Verificar qué tallas/colores tienen stock dado el otro atributo seleccionado
  function sizeHasStock(size: string) {
    return variants.some(
      (v) =>
        v.attributes.talla === size &&
        (!selectedColor || v.attributes.color === selectedColor) &&
        (v.stock - v.reserved) > 0
    );
  }
  function colorHasStock(color: string) {
    return variants.some(
      (v) =>
        v.attributes.color === color &&
        (!selectedSize || v.attributes.talla === selectedSize) &&
        (v.stock - v.reserved) > 0
    );
  }

  async function handleAddToCart() {
    if (!canAddToCart || !selectedVariant) return;
    setAdding(true);
    setFeedback(null);

    const ok = await addItem({
      variantId: selectedVariant.id,
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      image: product.images[0] ?? "",
      sku: selectedVariant.sku,
      attributes: selectedVariant.attributes,
      quantity,
      unitPrice: selectedVariant.price ?? product.base_price,
    });

    setFeedback(ok ? "ok" : "error");
    setAdding(false);
  }

  return (
    <div className="space-y-5">
      {/* TALLAS */}
      {sizes.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-2.5">
            <span className="text-[10px] tracking-[0.2em] uppercase text-[#6E6680] font-[600]">
              Talla{selectedSize ? `: ${selectedSize}` : ""}
            </span>
            <button
              onClick={() => setShowSizeGuide(true)}
              className="text-[10px] text-[#A0647E] underline underline-offset-2"
            >
              Guía de tallas
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {sizes.map((size) => {
              const hasStock = sizeHasStock(size);
              return (
                <button
                  key={size}
                  onClick={() => hasStock && setSelectedSize(size === selectedSize ? null : size)}
                  disabled={!hasStock}
                  className={cn(
                    "w-10 h-10 text-xs font-[500] border transition-colors",
                    selectedSize === size
                      ? "border-[#1E1B2E] bg-[#1E1B2E] text-white"
                      : hasStock
                      ? "border-[#E9DDE3] text-[#1E1B2E] hover:border-[#6E6680]"
                      : "border-[#E9DDE3] text-[#D9C3CE] cursor-not-allowed line-through"
                  )}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* COLORES */}
      {colors.length > 0 && (
        <div>
          <span className="text-[10px] tracking-[0.2em] uppercase text-[#6E6680] font-[600] block mb-2.5">
            Color{selectedColor ? `: ${selectedColor}` : ""}
          </span>
          <div className="flex flex-wrap gap-2">
            {colors.map((color) => {
              const hasStock = colorHasStock(color);
              return (
                <button
                  key={color}
                  onClick={() => hasStock && setSelectedColor(color === selectedColor ? null : color)}
                  disabled={!hasStock}
                  className={cn(
                    "px-4 h-9 text-xs font-[400] border transition-colors",
                    selectedColor === color
                      ? "border-[#1E1B2E] bg-[#1E1B2E] text-white"
                      : hasStock
                      ? "border-[#E9DDE3] text-[#1E1B2E] hover:border-[#6E6680]"
                      : "border-[#E9DDE3] text-[#D9C3CE] cursor-not-allowed line-through"
                  )}
                >
                  {color}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* CANTIDAD */}
      {!isSoldOut && selectedVariant && available > 0 && (
        <div>
          <span className="text-[10px] tracking-[0.2em] uppercase text-[#6E6680] font-[600] block mb-2.5">
            Cantidad
          </span>
          <div className="flex items-center border border-[#E9DDE3] w-fit">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="w-10 h-10 flex items-center justify-center text-[#6E6680] hover:text-[#1E1B2E] text-lg"
            >
              −
            </button>
            <span className="w-10 text-center text-sm text-[#1E1B2E] font-[500]">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity((q) => Math.min(available, q + 1))}
              className="w-10 h-10 flex items-center justify-center text-[#6E6680] hover:text-[#1E1B2E] text-lg"
            >
              +
            </button>
          </div>
          {available <= 5 && (
            <p className="text-xs text-[#A0647E] mt-1.5">
              Solo {available} disponibles
            </p>
          )}
        </div>
      )}

      {/* BOTONES */}
      <div className="flex flex-col gap-3 pt-2">
        {isSoldOut ? (
          <button
            disabled
            className="w-full py-4 bg-[#D9C3CE] text-[#6E6680] text-[11px] tracking-[0.2em] uppercase font-[500] cursor-not-allowed"
          >
            Agotado
          </button>
        ) : (
          <button
            onClick={handleAddToCart}
            disabled={!canAddToCart || adding}
            className={cn(
              "w-full py-4 flex items-center justify-center gap-2 text-[11px] tracking-[0.2em] uppercase font-[500] transition-colors",
              canAddToCart && !adding
                ? "bg-[#1E1B2E] text-[#FAF6F7] hover:bg-[#34304A]"
                : "bg-[#D9C3CE] text-[#6E6680] cursor-not-allowed"
            )}
          >
            <ShoppingBag size={15} strokeWidth={1.5} />
            {adding ? "Añadiendo..." : "Añadir al carrito"}
          </button>
        )}

        <button className="w-full py-3 border border-[#E9DDE3] flex items-center justify-center gap-2 text-[11px] tracking-[0.2em] uppercase font-[500] text-[#6E6680] hover:border-[#A0647E] hover:text-[#A0647E] transition-colors">
          <Heart size={14} strokeWidth={1.5} />
          Añadir a favoritos
        </button>
      </div>

      {/* FEEDBACK */}
      {feedback === "ok" && (
        <p className="text-xs text-green-600 flex items-center gap-1.5">
          ✓ Producto añadido al carrito
        </p>
      )}
      {feedback === "error" && (
        <p className="text-xs text-[#A0647E] flex items-center gap-1.5">
          <AlertCircle size={12} />
          Sin stock disponible. Intenta de nuevo.
        </p>
      )}

      {/* MODAL GUÍA DE TALLAS */}
      {showSizeGuide && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowSizeGuide(false)}
        >
          <div
            className="relative bg-white max-w-lg w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowSizeGuide(false)}
              className="absolute top-3 right-3 text-[#6E6680] hover:text-[#1E1B2E] transition-colors z-10"
              aria-label="Cerrar"
            >
              <X size={20} strokeWidth={1.5} />
            </button>
            <Image
              src="/guia-tallas.jpg"
              alt={`Tabla de medidas ${storeName}`}
              width={800}
              height={600}
              className="w-full h-auto"
              priority
            />
          </div>
        </div>
      )}
    </div>
  );
}
