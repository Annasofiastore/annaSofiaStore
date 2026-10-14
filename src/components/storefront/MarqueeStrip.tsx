import { getStoreName } from "@/lib/config/store-name";
const wordsFor = (storeName: string) => [
  "◈ Nueva Colección",
  `◈ ${storeName}`,
  "◈ Cartagena",
  "◈ Mujeres que visten con intención",
  "◈ Hecho con amor",
  "◈ Diseño exclusivo",
];

export async function MarqueeStrip({ inverted = false }: { inverted?: boolean }) {
  const text = wordsFor(await getStoreName()).join("   ") + "   ";
  const bg = inverted ? "bg-[#FAF6F7]" : "bg-[#1E1B2E]";
  const color = inverted ? "text-[#6E6680]" : "text-[#FAF6F7]";
  const border = inverted ? "border-[#E9DDE3]" : "";

  return (
    <div className={`${bg} ${border} border-y overflow-hidden py-3 select-none`}>
      <div className="flex whitespace-nowrap">
        {/* Duplicamos el texto para que el loop sea seamless */}
        <span className={`animate-marquee inline-block ${color} text-[11px] tracking-[0.18em] uppercase font-[500]`}>
          {text.repeat(6)}
        </span>
      </div>
    </div>
  );
}
