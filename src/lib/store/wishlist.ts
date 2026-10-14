import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { brand } from "@/lib/config/brand";

interface WishlistStore {
  productIds: string[];
  toggle: (productId: string) => void;
  has: (productId: string) => boolean;
  count: () => number;
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      productIds: [],

      toggle: (productId) =>
        set((state) => ({
          productIds: state.productIds.includes(productId)
            ? state.productIds.filter((id) => id !== productId)
            : [...state.productIds, productId],
        })),

      has: (productId) => get().productIds.includes(productId),

      count: () => get().productIds.length,
    }),
    {
      name: `${brand.slug}-wishlist`,
      storage: createJSONStorage(() => localStorage),
    }
  )
);
