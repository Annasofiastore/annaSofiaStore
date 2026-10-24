import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { brand, location } from "@/lib/config/brand";
import { getStoreName } from "@/lib/config/store-name";
import { getNosotrasContent, getNosotrasImage, toParagraphs } from "@/lib/config/nosotras";

export async function generateMetadata(): Promise<Metadata> {
  const storeName = await getStoreName();
  return {
    title: "Conócenos",
    description: `${storeName} — ${brand.tagline}. Desde ${location}.`,
  };
}

// CONTENIDO A PERSONALIZAR — reemplazar con el equipo real de la tienda.
// Dejar el arreglo vacío oculta la sección completa.
const TEAM = [
  {
    name: "Nombre de la fundadora",
    role: "Fundadora",
    bio: "Una o dos frases sobre quién es y por qué nació la tienda.",
  },
];

export default async function NosotrasPage() {
  const storeName = await getStoreName();
  const [historiaImage, content] = await Promise.all([getNosotrasImage(), getNosotrasContent(storeName)]);

  return (
    <>
      {/* Hero */}
      <section className="relative bg-[#F5DDE5]/30 py-28 sm:py-36 px-4 sm:px-6 lg:px-8 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#F7F2EC] to-transparent opacity-60" />
        <div className="relative z-10 max-w-[1440px] mx-auto">
          <span className="text-[10px] tracking-[0.3em] uppercase text-[#A0526C] font-[500]">
            Nuestra historia
          </span>
          <h1
            className="text-6xl sm:text-7xl lg:text-8xl text-[#221A33] mt-4 leading-[1.05]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Conócenos
          </h1>

        </div>
      </section>

      {/* Historia */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
        <div className="grid md:grid-cols-2 gap-12 lg:gap-24 items-center">
          {/* Imagen historia — configurable desde el panel admin */}
          <div className="relative aspect-[4/5] overflow-hidden">
            <Image
              src={historiaImage}
              alt={`${storeName} — Nuestra historia`}
              fill
              className="object-cover object-top"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
              unoptimized={historiaImage.startsWith("/")}
            />
          </div>

          <div>
            <span className="text-xs tracking-[0.3em] uppercase text-[#A0526C] font-[500]">
              El origen
            </span>
            <h2
              className="text-4xl sm:text-5xl text-[#221A33] mt-3 mb-8"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {content.title}
            </h2>
            <div className="space-y-5 text-base sm:text-lg text-[#766A63] leading-relaxed font-[300] max-w-xl">
              {toParagraphs(content.body).map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#221A33] py-24 sm:py-32 px-4 sm:px-6 lg:px-8 text-center">
        <span className="text-[10px] tracking-[0.3em] uppercase text-[#A0526C] font-[500]">
          Únete a nuestra comunidad
        </span>
        <h2
          className="text-4xl sm:text-5xl lg:text-6xl text-[#F7F2EC] mt-4 mb-6"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Viste con intención
        </h2>
        <p className="text-base sm:text-lg text-[#DCCFC4] mb-10 font-[300] max-w-xl mx-auto">
          Conoce nuestras prendas y síguenos en Instagram para ver las novedades y ideas para combinar cada look.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/catalogo"
            className="inline-flex items-center gap-2 px-8 py-3 bg-[#F5DDE5] text-[#221A33] text-[11px] tracking-[0.2em] uppercase font-[600] hover:bg-[#F7F2EC] transition-colors rounded-full"
          >
            Ver catálogo <ArrowRight size={13} />
          </Link>
          {brand.social.instagram && (
            <a
              href={brand.social.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-3 border border-[#F7F2EC]/70 text-[#F7F2EC] text-[11px] tracking-[0.2em] uppercase font-[600] hover:bg-[#F7F2EC] hover:text-[#221A33] transition-colors rounded-full"
            >
              Seguir en Instagram <ArrowRight size={13} />
            </a>
          )}
        </div>
      </section>
    </>
  );
}
