"use client";

import Image from "next/image";
import { useState } from "react";

interface Props {
  /** Puede venir vacío: `images[0]` de un producto sin fotos es undefined. */
  src: string | undefined;
  alt: string;
  /** "md" para las tarjetas de inventario en celular, donde 40px se queda corto. */
  size?: "sm" | "md";
}

const BOX = { sm: "w-10 h-12", md: "w-16 h-20" };
const SIZES = { sm: "40px", md: "64px" };

export function ProductThumb({ src, alt, size = "sm" }: Props) {
  const [error, setError] = useState(false);

  if (!src || error) {
    return (
      <div className={`${BOX[size]} shrink-0 bg-[#F2D4DC]/20 flex items-center justify-center`}>
        <span
          className="text-[10px] text-[#6E6680]"
          style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic" }}
        >
          MB
        </span>
      </div>
    );
  }

  return (
    <div className={`relative ${BOX[size]} shrink-0 overflow-hidden bg-[#F2D4DC]/20`}>
      <Image
        src={src}
        alt={alt}
        fill
        unoptimized
        className="object-cover"
        sizes={SIZES[size]}
        onError={() => setError(true)}
      />
    </div>
  );
}
