"use client";

import { useState } from "react";
import { Banknote } from "lucide-react";

/**
 * Logos oficiales de los medios de pago. Los archivos están en /public/pagos. Si un archivo falta, se muestra el nombre.
 */
// "wide" = logo alargado (se iguala por ancho); "compact" = casi cuadrado (se iguala por alto, un poco más grande).
const ONLINE: { name: string; file: string; shape: "wide" | "compact" }[] = [
  { name: "Visa", file: "/pagos/visa.svg", shape: "wide" },
  { name: "Mastercard", file: "/pagos/mastercard.svg", shape: "compact" },
  { name: "American Express", file: "/pagos/amex.svg", shape: "compact" },
  { name: "Nequi", file: "/pagos/nequi.svg", shape: "wide" },
  { name: "PSE", file: "/pagos/pse.png", shape: "compact" },
  { name: "Wompi", file: "/pagos/wompi.svg", shape: "wide" },
];

type Size = "md" | "lg";

function Chip({ children, title, size = "md", bare = false }: { children: React.ReactNode; title: string; size?: Size; bare?: boolean }) {
  // Fondo blanco fijo: los logos de marca están pensados para fondo claro, también sobre el footer oscuro.
  return (
    <span
      title={title}
      className={`inline-flex items-center justify-center font-[600] text-[#4D4458] ${bare ? "" : "rounded bg-white border border-[#E8DED4]"} ${size === "lg" ? `h-14 w-full sm:h-16 sm:w-auto sm:min-w-20 text-sm ${bare ? "" : "px-4"}` : "h-7 min-w-11 px-2 text-[10px]"}`}
    >
      {children}
    </span>
  );
}

function Logo({ name, file, shape, size, bare }: { name: string; file: string; shape: "wide" | "compact"; size: Size; bare: boolean }) {
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
          className={`object-contain ${
            size === "lg"
              ? shape === "wide"
                ? "w-24 h-auto sm:w-auto sm:h-12 sm:max-w-36"
                : "h-11 w-auto sm:h-12"
              : "h-5 w-auto max-w-16"
          }`}
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
    <div
      className={`${
        size === "lg"
          ? "grid grid-cols-3 justify-items-center items-center gap-x-2 gap-y-3 sm:flex sm:flex-wrap sm:justify-center sm:gap-x-8 sm:gap-y-4"
          : "flex flex-wrap items-center gap-1.5"
      } ${className}`}
    >
      {online && ONLINE.map((m) => <Logo key={m.name} {...m} size={size} bare={bare} />)}
      {cash && (
        <Chip title="Pago contra entrega en Lorica" size={size} bare={bare}>
          <Banknote size={14} className="mr-1" aria-hidden /> Contraentrega en Lorica
        </Chip>
      )}
    </div>
  );
}
