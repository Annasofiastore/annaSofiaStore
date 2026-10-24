import { getStoreName } from "@/lib/config/store-name";

const wordsFor = (storeName: string) => [
  "Nueva colección",
  storeName,
  "Elegancia que brilla",
  "Hecho para ti",
  "Diseños exclusivos",
  "Brilla a tu manera",
];

/**
 * Franja con frases en movimiento, en la tipografía de los títulos.
 * La principal va en negro cálido; la invertida, en el fondo claro con bordes finos.
 */
export async function MarqueeStrip({ inverted = false }: { inverted?: boolean }) {
  const words = wordsFor(await getStoreName());
  const surface = inverted
    ? "bg-[#F7F2EC] border-y border-[#E8DED4] text-[#221A33]"
    : "bg-[#221A33] text-[#F7F2EC]";

  // Seis copias para que el loop (que avanza la mitad del ancho) no muestre cortes
  const items = Array.from({ length: 6 }, () => words).flat();

  return (
    <div className={`${surface} overflow-hidden py-4 sm:py-5 select-none`} aria-hidden>
      <div className="flex whitespace-nowrap">
        <span
          className="animate-marquee inline-flex items-center text-lg sm:text-[22px]"
          style={{ fontFamily: "var(--font-display)", animationDuration: "60s" }}
        >
          {items.map((w, i) => (
            <span key={i} className="inline-flex items-center">
              <span className={i % 2 ? "italic" : undefined}>{w}</span>
              <span className="text-[#E8B9C7] mx-6 sm:mx-9 text-sm">✦</span>
            </span>
          ))}
        </span>
      </div>
    </div>
  );
}
