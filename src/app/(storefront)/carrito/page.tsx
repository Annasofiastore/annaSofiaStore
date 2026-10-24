"use client";

import Link from "next/link";
import Image from "next/image";
import { Trash2, ArrowRight, ShoppingBag } from "lucide-react";
import { useCartStore } from "@/lib/store/cart";
import { formatCOP, monogramOf } from "@/lib/utils/format";
import { CountdownTimer } from "@/components/storefront/CountdownTimer";
import { useStoreName } from "@/components/StoreNameProvider";

export default function CarritoPage() {
  const monogram = monogramOf(useStoreName());
  const { items, subtotal, discountAmount, shippingCost, total, removeItem, updateQuantity } =
    useCartStore();

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-5 text-center px-4">
        <ShoppingBag size={48} strokeWidth={1} className="text-[#DCCFC4]" />
        <h1
          className="text-3xl text-[#221A33]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Tu carrito está vacío
        </h1>
        <p className="text-sm text-[#766A63] max-w-xs">
          Explora nuestro catálogo y encuentra tu próxima prenda favorita.
        </p>
        <Link
          href="/catalogo"
          className="inline-flex items-center gap-2 px-8 py-3 bg-[#221A33] text-[#F7F2EC] text-[11px] tracking-[0.2em] uppercase font-[500] hover:bg-[#352A4B] transition-colors rounded-full"
        >
          Ver catálogo <ArrowRight size={14} />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1
        className="text-4xl text-[#221A33] mb-8"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Tu carrito
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* ── ITEMS ── */}
        <div className="lg:col-span-2 space-y-0">
          {items.map((item, idx) => (
            <div
              key={item.variantId}
              className={`flex gap-4 py-5 ${idx !== 0 ? "border-t border-[#E8DED4]" : ""}`}
            >
              {/* Imagen */}
              <div className="relative w-20 h-28 shrink-0 bg-[#F5DDE5]/20 overflow-hidden">
                {item.image ? (
                  <Image
                    src={item.image}
                    alt={item.productName}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span
                      className="text-lg text-[#766A63]"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      {monogram}
                    </span>
                  </div>
                )}
              </div>

              {/* Detalle */}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between gap-2">
                  <div>
                    <Link
                      href={`/producto/${item.productSlug}`}
                      className="text-sm text-[#221A33] font-[400] hover:text-[#A0526C] transition-colors"
                    >
                      {item.productName}
                    </Link>
                    <p className="text-xs text-[#766A63] mt-0.5">
                      {Object.entries(item.attributes)
                        .map(([k, v]) => `${k}: ${v}`)
                        .join(" · ")}
                    </p>
                    {item.reservedUntil && (
                      <CountdownTimer expiresAt={item.reservedUntil} />
                    )}
                  </div>
                  <button
                    onClick={() => removeItem(item.variantId)}
                    aria-label="Eliminar"
                    className="text-[#DCCFC4] hover:text-[#A0526C] transition-colors shrink-0"
                  >
                    <Trash2 size={15} strokeWidth={1.5} />
                  </button>
                </div>

                <div className="flex items-center justify-between mt-3">
                  {/* Cantidad */}
                  <div className="flex items-center border border-[#E8DED4]">
                    <button
                      onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                      className="w-8 h-8 flex items-center justify-center text-[#766A63] hover:text-[#221A33]"
                    >
                      −
                    </button>
                    <span className="w-8 text-center text-xs text-[#221A33] font-[500]">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                      className="w-8 h-8 flex items-center justify-center text-[#766A63] hover:text-[#221A33]"
                    >
                      +
                    </button>
                  </div>

                  {/* Precio */}
                  <span className="text-sm text-[#221A33] font-[500]">
                    {formatCOP(item.unitPrice * item.quantity)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── RESUMEN ── */}
        <div className="bg-[#F5DDE5]/15 border border-[#E8DED4] p-6 h-fit">
          <h2 className="text-[10px] tracking-[0.25em] uppercase text-[#766A63] font-[600] mb-5">
            Resumen del pedido
          </h2>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between text-[#221A33]">
              <span>Subtotal</span>
              <span>{formatCOP(subtotal)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-[#A0526C]">
                <span>Descuento</span>
                <span>-{formatCOP(discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-[#766A63]">
              <span>Envío</span>
              <span>
                {shippingCost > 0 ? formatCOP(shippingCost) : "Se calcula en checkout"}
              </span>
            </div>
            <div className="border-t border-[#E8DED4] pt-3 flex justify-between font-[500] text-[#221A33]">
              <span>Total</span>
              <span>{formatCOP(total)}</span>
            </div>
          </div>

          <Link
            href="/checkout"
            className="mt-6 w-full flex items-center justify-center gap-2 py-4 bg-[#221A33] text-[#F7F2EC] text-[11px] tracking-[0.2em] uppercase font-[500] hover:bg-[#352A4B] transition-colors rounded-full"
          >
            Proceder al pago <ArrowRight size={14} />
          </Link>

          <Link
            href="/catalogo"
            className="mt-3 w-full flex items-center justify-center text-[10px] tracking-[0.15em] uppercase text-[#766A63] hover:text-[#221A33] transition-colors py-2"
          >
            Seguir comprando
          </Link>
        </div>
      </div>
    </div>
  );
}
