"use client";

import { createContext, useContext } from "react";
import { brand } from "@/lib/config/brand";

const StoreNameContext = createContext<string>(brand.name);

// El root layout lee el nombre en el servidor y lo entrega aquí a los Client Components
export function StoreNameProvider({ name, children }: { name: string; children: React.ReactNode }) {
  return <StoreNameContext.Provider value={name}>{children}</StoreNameContext.Provider>;
}

export function useStoreName() {
  return useContext(StoreNameContext);
}
