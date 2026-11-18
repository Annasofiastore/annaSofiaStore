"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

interface Ctx {
  /** Color elegido en el selector (null si no hay). */
  color: string | null;
  setColor: (color: string | null) => void;
  /** Fotos de cada color, por nombre en minúsculas. */
  colorImages: Record<string, string[]>;
}

const ProductColorContext = createContext<Ctx>({ color: null, setColor: () => {}, colorImages: {} });

/** Comparte el color elegido entre el selector de variantes y la galería de fotos. */
export function ProductColorProvider({
  colorImages = {},
  children,
}: {
  colorImages?: Record<string, string[]>;
  children: ReactNode;
}) {
  const [color, setColor] = useState<string | null>(null);
  return <ProductColorContext.Provider value={{ color, setColor, colorImages }}>{children}</ProductColorContext.Provider>;
}

export const useProductColor = () => useContext(ProductColorContext);
