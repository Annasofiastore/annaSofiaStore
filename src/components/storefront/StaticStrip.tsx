/**
 * Franja fija a todo el ancho, con frases de marca separadas por un punto.
 * Para cambiar los textos, editar PHRASES.
 */
const PHRASES = ["Elegancia que brilla", "Hecho para ti"];

export function StaticStrip() {
  return (
    <div className="bg-[#221A33] text-[#F7F2EC] py-4 sm:py-5 px-4">
      <ul
        className="flex flex-wrap items-center justify-center gap-x-5 sm:gap-x-8 gap-y-1 text-base sm:text-[22px] text-center"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {PHRASES.map((phrase, i) => (
          <li key={phrase} className="flex items-center gap-x-5 sm:gap-x-8">
            {i > 0 && <span aria-hidden className="text-[#E8B9C7]">·</span>}
            {phrase}
          </li>
        ))}
      </ul>
    </div>
  );
}
