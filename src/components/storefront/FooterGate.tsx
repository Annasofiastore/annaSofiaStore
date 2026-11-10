"use client";

import { usePathname } from "next/navigation";

// Rutas del cierre de compra: en celular no se muestra el footer para no distraer del pago.
const CHECKOUT_PATHS = ["/checkout", "/confirmacion"];

export function FooterGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const inCheckout = CHECKOUT_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  return <div className={inCheckout ? "hidden lg:block" : undefined}>{children}</div>;
}
