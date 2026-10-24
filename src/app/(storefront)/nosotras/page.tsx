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

const VALUES = [
  {
    title: "Intencional",
    desc: "Con propósito detrás de cada costura. Cada prenda nace desde el amor.",
  },
  {
    title: "Versátil",
    desc: "De los días simples a los momentos especiales. Prendas que se adaptan a tu día a día.",
  },
  {
    title: "Femenina",
    desc: "Diseños que resaltan tu esencia. Delicadeza, confianza y estilo en cada detalle.",
  },
  {
    title: "Auténtica",
    desc: "Cada prenda refleja quién quieres ser.",
  },
];

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
      <section className="relative bg-[#F5DDE5]/30 py-24 px-4 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#F7F2EC] to-transparent opacity-60" />
        <div className="relative z-10 max-w-xl mx-auto">
          <span className="text-[10px] tracking-[0.3em] uppercase text-[#A0526C] font-[500]">
            Nuestra historia
          </span>
          <h1
            className="text-5xl text-[#221A33] mt-3 mb-5 leading-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Conócenos
          </h1>

        </div>
      </section>

      {/* Historia */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-20">
        <div className="grid md:grid-cols-[2fr_3fr] gap-12 items-start">
          {/* Imagen historia — configurable desde el panel admin */}
          <div className="relative aspect-[3/4] overflow-hidden">
            <Image
              src={historiaImage}
              alt={`${storeName} — Nuestra historia`}
              fill
              className="object-cover object-top"
              sizes="(max-width: 768px) 100vw, 40vw"
              priority
              unoptimized={historiaImage.startsWith("/")}
            />
          </div>

          <div>
            <span className="text-[10px] tracking-[0.28em] uppercase text-[#A0526C] font-[500]">
              El origen
            </span>
            <h2
              className="text-3xl text-[#221A33] mt-2 mb-5"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {content.title}
            </h2>
            <div className="space-y-4 text-sm text-[#766A63] leading-loose font-[300]">
              {toParagraphs(content.body).map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Valores */}
      <section className="bg-[#F7F2EC] border-y border-[#E8DED4] py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-[10px] tracking-[0.28em] uppercase text-[#A0526C] font-[500]">
              Lo que nos define
            </span>
            <h2
              className="text-4xl text-[#221A33] mt-2"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Nuestros valores
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {VALUES.map((v) => (
              <div key={v.title} className="text-center">
                <div className="w-10 h-px bg-[#A0526C] mx-auto mb-4" />
                <h3
                  className="text-lg text-[#221A33] mb-2"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {v.title}
                </h3>
                <p className="text-xs text-[#766A63] leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#221A33] py-20 px-4 text-center">
        <span className="text-[10px] tracking-[0.3em] uppercase text-[#A0526C] font-[500]">
          Únete a nuestra comunidad
        </span>
        <h2
          className="text-3xl text-[#F7F2EC] mt-3 mb-5"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Viste con intención
        </h2>
        <p className="text-sm text-[#DCCFC4] mb-8 font-[300] max-w-md mx-auto">
          Descubre prendas curaduras para mujeres que saben lo que quieren.
        </p>
        <Link
          href="/catalogo"
          className="inline-flex items-center gap-2 px-8 py-3 bg-[#F5DDE5] text-[#221A33] text-[11px] tracking-[0.2em] uppercase font-[600] hover:bg-[#F7F2EC] transition-colors rounded-full"
        >
          Ver catálogo <ArrowRight size={13} />
        </Link>
      </section>
    </>
  );
}
