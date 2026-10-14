"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Heart, ShoppingBag, AlertCircle, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useCartStore } from "@/lib/store/cart";
import { useWishlistStore } from "@/lib/store/wishlist";
import { formatCOP } from "@/lib/utils/format";
import type { Product, ProductVariant } from "@/types";
import { useStoreName } from "@/components/StoreNameProvider";

// Orden de tallas de menor a mayor; las desconocidas (o numéricas) van al final en orden natural
const SIZE_ORDER = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL"];
function bySizeOrder(a: string, b: string) {
  const ia = SIZE_ORDER.indexOf(a.toUpperCase());
  const ib = SIZE_ORDER.indexOf(b.toUpperCase());
  if (ia !== -1 || ib !== -1) return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  return a.localeCompare(b, "es", { numeric: true });
}

interface Props {
  product: Product;
  /** Código hex por nombre de color (en minúsculas), para pintar los círculos. */
  colorHex?: Record<string, string>;
}

export function VariantSelector({ product, colorHex = {} }: Props) {
  const storeName = useStoreName();
  const { variants = [] } = product;

  // Extraer valores únicos de talla y color
  const sizes = [
    ...new Set(
      variants
        .map((v) => v.attributes.talla)
        .filter(Boolean) as string[]
    ),
  ].sort(bySizeOrder);
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
  const toggleWishlist = useWishlistStore((s) => s.toggle);
  const wishlisted = useWishlistStore((s) => s.productIds.includes(product.id));

  // Barra fija en celular cuando el botón principal sale de la pantalla
  const ctaRef = useRef<HTMLDivElement>(null);
  const [showStickyBar, setShowStickyBar] = useState(false);
  useEffect(() => {
    const el = ctaRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setShowStickyBar(!entry.isIntersecting && entry.boundingClientRect.top < 0));
    io.observe(el);
    return () => io.disconnect();
  }, []);

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
  const unitPrice = selectedVariant?.price ?? product.effective_price ?? product.base_price;
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

  const ctaLabel = adding
    ? "Añadiendo..."
    : sizes.length && !selectedSize
    ? "Selecciona una talla"
    : colors.length && !selectedColor
    ? "Selecciona un color"
    : !selectedVariant || available <= 0
    ? "Sin stock en esta combinación"
    : "Añadir al carrito";

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
                    "min-w-11 h-11 px-3 rounded-full text-sm font-[500] border transition-colors",
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
          <div className="flex flex-wrap gap-3">
            {colors.map((color) => {
              const hasStock = colorHasStock(color);
              const hex = colorHex[color.toLowerCase()];
              const selected = selectedColor === color;
              const onClick = () => hasStock && setSelectedColor(selected ? null : color);
              return hex ? (
                <button
                  key={color}
                  onClick={onClick}
                  disabled={!hasStock}
                  title={color}
                  aria-label={color}
                  aria-pressed={selected}
                  className={cn(
                    "relative w-9 h-9 rounded-full border border-[#1E1B2E]/15 transition-shadow",
                    selected ? "ring-2 ring-offset-2 ring-offset-[#FAF6F7] ring-[#1E1B2E]" : "hover:ring-1 hover:ring-offset-2 hover:ring-[#6E6680]",
                    !hasStock && "opacity-35 cursor-not-allowed"
                  )}
                  style={{ backgroundColor: hex }}
                >
                  {!hasStock && <span className="absolute inset-0 m-auto w-full h-px bg-[#6E6680] rotate-45" />}
                </button>
              ) : (
                <button
                  key={color}
                  onClick={onClick}
                  disabled={!hasStock}
                  className={cn(
                    "px-4 h-9 rounded-full text-xs font-[400] border transition-colors",
                    selected
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
          <div className="flex items-center border border-[#E9DDE3] rounded-full w-fit px-1">
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
      <div ref={ctaRef} className="flex flex-col gap-3 pt-2">
        {isSoldOut ? (
          <button
            disabled
            className="w-full py-4 bg-[#D9C3CE] text-[#6E6680] text-[11px] tracking-[0.2em] uppercase font-[500] cursor-not-allowed rounded-full"
          >
            Agotado
          </button>
        ) : (
          <button
            onClick={handleAddToCart}
            disabled={!canAddToCart || adding}
            className={cn(
              "w-full py-4 flex items-center justify-center gap-2 text-[11px] tracking-[0.2em] uppercase font-[500] transition-colors rounded-full",
              canAddToCart && !adding
                ? "bg-[#1E1B2E] text-[#FAF6F7] hover:bg-[#34304A]"
                : "bg-[#D9C3CE] text-[#6E6680] cursor-not-allowed"
            )}
          >
            <ShoppingBag size={15} strokeWidth={1.5} />
            {ctaLabel}
          </button>
        )}

        <button
          onClick={() => toggleWishlist(product.id)}
          aria-pressed={wishlisted}
          className={cn(
            "w-full py-3 border flex items-center justify-center gap-2 text-[11px] tracking-[0.2em] uppercase font-[500] transition-colors rounded-full",
            wishlisted
              ? "border-[#A0647E] text-[#A0647E]"
              : "border-[#E9DDE3] text-[#6E6680] hover:border-[#A0647E] hover:text-[#A0647E]"
          )}
        >
          <Heart size={14} strokeWidth={1.5} fill={wishlisted ? "currentColor" : "none"} />
          {wishlisted ? "En tus favoritos" : "Añadir a favoritos"}
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

      {/* BARRA FIJA (celular) */}
      {!isSoldOut && (
        <div
          className={cn(
            "lg:hidden fixed inset-x-0 bottom-0 z-40 bg-[#FAF6F7]/95 backdrop-blur border-t border-[#E9DDE3] shadow-[0_-4px_20px_rgba(30,27,46,0.08)]",
            "pl-4 pr-24 py-3 flex items-center gap-3 transition-transform duration-300",
            showStickyBar ? "translate-y-0" : "translate-y-full"
          )}
        >
          <div className="min-w-0 flex-1">
            <p className="text-xs text-[#1E1B2E] truncate">{product.name}</p>
            <p className="text-sm text-[#A0647E] font-[600]">{formatCOP(unitPrice)}</p>
          </div>
          <button
            onClick={canAddToCart ? handleAddToCart : () => ctaRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })}
            disabled={adding}
            className="shrink-0 px-5 py-3 rounded-full bg-[#1E1B2E] text-[#FAF6F7] text-[10px] tracking-[0.18em] uppercase font-[600]"
          >
            {canAddToCart ? (adding ? "Añadiendo..." : "Añadir") : sizes.length && !selectedSize ? "Elegir talla" : colors.length && !selectedColor ? "Elegir color" : "Ver opciones"}
          </button>
        </div>
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
