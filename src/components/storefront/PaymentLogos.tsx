"use client";

import { useState } from "react";
import { Banknote } from "lucide-react";

/**
 * Logos oficiales de los medios de pago. Los archivos están en /public/pagos. Si un archivo falta, se muestra el nombre.
 */
const ONLINE = [
  { name: "Visa", file: "/pagos/visa.svg" },
  { name: "Mastercard", file: "/pagos/mastercard.svg" },
  { name: "American Express", file: "/pagos/amex.svg" },
  { name: "Nequi", file: "/pagos/nequi.svg" },
  { name: "PSE", file: "/pagos/pse.png" },
  { name: "Wompi", file: "/pagos/wompi.svg" },
];

type Size = "md" | "lg";

function Chip({ children, title, size = "md", bare = false }: { children: React.ReactNode; title: string; size?: Size; bare?: boolean }) {
  // Fondo blanco fijo: los logos de marca están pensados para fondo claro, también sobre el footer oscuro.
  return (
    <span
      title={title}
      className={`inline-flex items-center justify-center font-[600] text-[#4D4458] ${bare ? "" : "rounded bg-white border border-[#E8DED4]"} ${size === "lg" ? `h-16 min-w-20 text-sm ${bare ? "" : "px-4"}` : "h-7 min-w-11 px-2 text-[10px]"}`}
    >
      {children}
    </span>
  );
}

function Logo({ name, file, size, bare }: { name: string; file: string; size: Size; bare: boolean }) {
  const [failed, setFailed] = useState(false);
  return (
    <Chip title={name} size={size} bare={bare}>
      {failed ? (
        name
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={file}
          alt={name}
          height={20}
          className={`w-auto object-contain ${size === "lg" ? "h-12 max-w-36" : "h-5 max-w-16"}`}
          onError={() => setFailed(true)}
        />
      )}
    </Chip>
  );
}

interface Props {
  /** Incluye "Contraentrega" (solo se ofrece en Lorica). */
  cash?: boolean;
  /** Incluye los medios en línea (tarjetas, PSE, Nequi). */
  online?: boolean;
  /** "lg" para el banner del inicio. */
  size?: Size;
  /** Sin recuadro blanco: los logos van directo sobre el fondo (solo si es claro). */
  bare?: boolean;
  className?: string;
}

export function PaymentLogos({ cash = false, online = true, size = "md", bare = false, className = "" }: Props) {
  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      {online && ONLINE.map((m) => <Logo key={m.name} {...m} size={size} bare={bare} />)}
      {cash && (
        <Chip title="Pago contra entrega en Lorica" size={size} bare={bare}>
          <Banknote size={14} className="mr-1" aria-hidden /> Contraentrega en Lorica
        </Chip>
      )}
    </div>
  );
}
