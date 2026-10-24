import Image from "next/image";
import { getStoreName } from "@/lib/config/store-name";

/**
 * Banner de medios de pago. Cuando haya imagen, ponerla en /public y
 * asignar la ruta aquí (ej. "/pagos.png"); mientras tanto se muestra en texto.
 */
const PAYMENTS_IMAGE: string | null = null;

const METHODS = ["Pago en línea con Wompi", "Contraentrega"];

export async function PaymentsBanner() {
  if (PAYMENTS_IMAGE) {
    return (
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Image
          src={PAYMENTS_IMAGE}
          alt="Medios de pago disponibles"
          width={0}
          height={0}
          sizes="100vw"
          className="w-full h-auto"
        />
      </section>
    );
  }

  const storeName = await getStoreName();

  return (
    <section className="relative overflow-hidden bg-[#F5DDE5]/50 border-y border-[#E8DED4] px-4 sm:px-6 lg:px-8 py-16 sm:py-24 mt-10 sm:mt-14 min-h-[240px] sm:min-h-[320px] flex items-center">
      {/* Fondo: nombre de la tienda en grande y muy tenue */}
      <span
        aria-hidden
        className="pointer-events-none select-none absolute inset-0 flex items-center justify-center px-4 text-center leading-none whitespace-nowrap text-[#A0526C]/15 text-[22vw] sm:text-[14vw] lg:text-[12rem]"
        style={{ fontFamily: "var(--font-script)" }}
      >
        {storeName}
      </span>
      <div className="relative w-full max-w-[1440px] mx-auto flex flex-col items-center justify-center gap-5 sm:gap-6 text-center">
        <span className="text-xs sm:text-sm tracking-[0.3em] uppercase text-[#A0526C] font-[500]">
          Medios de pago disponibles
        </span>
        <ul className="flex flex-wrap justify-center gap-x-8 gap-y-2 text-base sm:text-lg text-[#221A33]">
          {METHODS.map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
