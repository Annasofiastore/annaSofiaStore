import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Navbar } from "@/components/storefront/Navbar";
import { Footer } from "@/components/storefront/Footer";
import { WhatsAppButton } from "@/components/storefront/WhatsAppButton";

export const metadata: Metadata = {
  title: "Página no encontrada",
  robots: { index: false, follow: false },
};

// Sirve para cualquier enlace roto y para productos o colecciones que ya no existen.
// Queda fuera del grupo (storefront), así que lleva su propia barra y pie.
export default function NotFound() {
  return (
    <>
      <Navbar />
      <main className="flex-1 pt-16 flex items-center justify-center px-4">
        <div className="max-w-xl text-center py-24 sm:py-32">
          <span
            className="block text-8xl sm:text-9xl text-[#E8B9C7] leading-none"
            style={{ fontFamily: "var(--font-display)" }}
          >
            404
          </span>
          <h1
            className="text-3xl sm:text-4xl text-[#221A33] mt-6 mb-4"
            style={{ fontFamily: "var(--font-display)" }}
          >
            No encontramos esta página
          </h1>
          <p className="text-[15px] text-[#766A63] leading-relaxed mb-10">
            Puede que el enlace haya cambiado o que la prenda que buscas ya no esté disponible.
            Te invitamos a seguir explorando nuestro catálogo.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/catalogo"
              className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-[#221A33] text-[#F7F2EC] text-[11px] tracking-[0.2em] uppercase font-[500] hover:bg-[#352A4B] transition-colors rounded-full"
            >
              Ver catálogo <ArrowRight size={13} />
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-8 py-3 border border-[#221A33] text-[#221A33] text-[11px] tracking-[0.2em] uppercase font-[500] hover:bg-[#221A33] hover:text-[#F7F2EC] transition-colors rounded-full"
            >
              Ir al inicio
            </Link>
          </div>
        </div>
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}
