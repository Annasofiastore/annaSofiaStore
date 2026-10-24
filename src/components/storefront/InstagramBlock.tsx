import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { brand, instagramHandle } from "@/lib/config/brand";

/** Fotos del bloque (rutas en /public o URLs). Vacío = solo texto y botón. */
const INSTAGRAM_PHOTOS: string[] = [];

export function InstagramBlock() {
  if (!brand.social.instagram || !instagramHandle) return null;

  return (
    <section className="bg-[#DCCFC4]/50 px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center">
      <div className="max-w-[1440px] mx-auto">
      <span className="block text-xs tracking-[0.3em] uppercase text-[#A0526C] font-[500] mb-4">
        Síguenos en Instagram
      </span>
      <a
        href={brand.social.instagram}
        target="_blank"
        rel="noopener noreferrer"
        className="text-3xl sm:text-4xl text-[#221A33] hover:text-[#A0526C] transition-colors"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {instagramHandle}
      </a>

      {INSTAGRAM_PHOTOS.length > 0 && (
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-2 mt-10">
          {INSTAGRAM_PHOTOS.map((src) => (
            <a
              key={src}
              href={brand.social.instagram!}
              target="_blank"
              rel="noopener noreferrer"
              className="relative block aspect-square overflow-hidden group"
            >
              <Image
                src={src}
                alt=""
                fill
                sizes="(max-width:1024px) 33vw, 16vw"
                unoptimized
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </a>
          ))}
        </div>
      )}

      <div className="mt-8">
        <a
          href={brand.social.instagram}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-8 py-3 border border-[#221A33]/70 text-[#221A33] text-xs tracking-[0.2em] uppercase font-[500] hover:bg-[#221A33] hover:text-[#F7F2EC] transition-colors rounded-full"
        >
          Ver perfil <ArrowRight size={13} />
        </a>
      </div>
      </div>
    </section>
  );
}
