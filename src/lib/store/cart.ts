import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Cart, CartItem, Promotion } from "@/types";
import { v4 as uuidv4 } from "uuid";
import { brand } from "@/lib/config/brand";

interface CartStore extends Cart {
  addItem: (item: Omit<CartItem, "reservedUntil">) => Promise<boolean>;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => Promise<boolean>;
  applyPromotion: (promotion: Promotion) => void;
  removePromotion: () => void;
  clearCart: () => void;
  setShippingCost: (cost: number) => void;
}

function computeTotals(
  items: CartItem[],
  shippingCost: number,
  promotion: Promotion | null | undefined
): Pick<Cart, "subtotal" | "discountAmount" | "total"> {
  const subtotal = items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );

  let discountAmount = 0;
  if (promotion) {
    discountAmount =
      promotion.discount_type === "percentage"
        ? subtotal * (promotion.discount_value / 100)
        : Math.min(promotion.discount_value, subtotal);
  }

  const total = Math.max(0, subtotal - discountAmount + shippingCost);
  return { subtotal, discountAmount, total };
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      subtotal: 0,
      discountAmount: 0,
      shippingCost: 0,
      total: 0,
      appliedPromotion: null,
      sessionId: uuidv4(),

      addItem: async (newItem) => {
        // Reservar stock vía API — RB-CHK-01
        try {
          const res = await fetch("/api/cart/reserve", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              variantId: newItem.variantId,
              quantity: newItem.quantity,
              sessionId: get().sessionId,
            }),
          });

          if (!res.ok) return false; // sin stock disponible

          const { reservedUntil } = await res.json();

          set((state) => {
            const existing = state.items.find(
              (i) => i.variantId === newItem.variantId
            );
            const items = existing
              ? state.items.map((i) =>
                  i.variantId === newItem.variantId
                    ? { ...i, quantity: i.quantity + newItem.quantity, reservedUntil }
                    : i
                )
              : [...state.items, { ...newItem, reservedUntil }];

            return {
              items,
              ...computeTotals(items, state.shippingCost, state.appliedPromotion),
            };
          });

          return true;
        } catch {
          return false;
        }
      },

      removeItem: (variantId) => {
        const { sessionId, items } = get();
        const item = items.find((i) => i.variantId === variantId);

        // Liberar reserva en BD en segundo plano — RB-CHK-01
        if (item) {
          fetch("/api/cart/release", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ variantId, sessionId }),
          }).catch(() => {});
        }

        set((state) => {
          const next = state.items.filter((i) => i.variantId !== variantId);
          return {
            items: next,
            ...computeTotals(next, state.shippingCost, state.appliedPromotion),
          };
        });
      },

      updateQuantity: async (variantId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(variantId);
          return true;
        }

        const { sessionId, items } = get();
        const current = items.find((i) => i.variantId === variantId);
        const currentQty = current?.quantity ?? 0;
        const diff = quantity - currentQty;

        if (diff === 0) return true;

        if (diff > 0) {
          // Aumentando — necesita reservar unidades adicionales
          try {
            const res = await fetch("/api/cart/reserve", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                variantId,
                quantity: diff,
                sessionId,
              }),
            });

            if (!res.ok) return false; // sin stock para aumentar

            const { reservedUntil } = await res.json();

            set((state) => {
              const next = state.items.map((i) =>
                i.variantId === variantId ? { ...i, quantity, reservedUntil } : i
              );
              return {
                items: next,
                ...computeTotals(next, state.shippingCost, state.appliedPromotion),
              };
            });
          } catch {
            return false;
          }
        } else {
          // Disminuyendo — liberar unidades sobrantes en segundo plano
          // La reserva original cubre la cantidad menor; liberamos el exceso
          fetch("/api/cart/release-partial", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ variantId, sessionId, quantity: Math.abs(diff) }),
          }).catch(() => {});

          set((state) => {
            const next = state.items.map((i) =>
              i.variantId === variantId ? { ...i, quantity } : i
            );
            return {
              items: next,
              ...computeTotals(next, state.shippingCost, state.appliedPromotion),
            };
          });
        }

        return true;
      },

      applyPromotion: (promotion) => {
        set((state) => ({
          appliedPromotion: promotion,
          ...computeTotals(state.items, state.shippingCost, promotion),
        }));
      },

      removePromotion: () => {
        set((state) => ({
          appliedPromotion: null,
          ...computeTotals(state.items, state.shippingCost, null),
        }));
      },

      setShippingCost: (cost) => {
        set((state) => ({
          shippingCost: cost,
          ...computeTotals(state.items, cost, state.appliedPromotion),
        }));
      },

      clearCart: () =>
        set({
          items: [],
          subtotal: 0,
          discountAmount: 0,
          shippingCost: 0,
          total: 0,
          appliedPromotion: null,
          sessionId: uuidv4(),
        }),
    }),
    {
      name: `${brand.slug}-cart`,
      storage: createJSONStorage(() => localStorage),
    }
  )
);
