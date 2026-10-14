import { unstable_cache } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * Textos de la sección Nosotras editables desde /admin/configuracion.
 * Se guardan en site_settings; los vacíos usan el respaldo de abajo.
 * Solo servidor.
 */

export const NOSOTRAS_TAG = "nosotras";

export const NOSOTRAS_KEYS = {
  title: "nosotras_title",
  body: "nosotras_body",
  summary: "nosotras_home_summary",
} as const;

export const NOSOTRAS_LIMITS = { title: 80, body: 5000, summary: 300 } as const;

export type NosotrasContent = { title: string; body: string; summary: string };

/** Respaldo cuando la tienda aún no escribió sus textos. {tienda} se reemplaza por el nombre. */
const DEFAULTS: NosotrasContent = {
  title: "Hola, somos {tienda}",
  body: [
    "Somos una marca colombiana creada para acompañar a la mujer en su día a día, recordándole que lo simple también puede ser especial y que cada momento tiene su significado.",
    "Desde el inicio, la inspiración ha sido clara: crear algo que vaya más allá de lo superficial, con el propósito de hacer que cada mujer se sienta hermosa, segura y conectada consigo misma.",
    "Cada prenda refleja nuestro propósito: ofrecer no solo diseño, sino una forma de sentir, donde la comodidad, la feminidad y la autenticidad se encuentran.",
  ].join("\n\n"),
  summary: "Una marca creada con el propósito de vestir mujeres que brillan.",
};

const getStoredNosotras = unstable_cache(
  async (): Promise<Partial<NosotrasContent>> => {
    try {
      const { data } = await createServiceClient()
        .from("site_settings")
        .select("key, value")
        .in("key", Object.values(NOSOTRAS_KEYS));
      const byKey = new Map((data ?? []).map((r) => [r.key, r.value?.trim() ?? ""]));
      return {
        title: byKey.get(NOSOTRAS_KEYS.title) || undefined,
        body: byKey.get(NOSOTRAS_KEYS.body) || undefined,
        summary: byKey.get(NOSOTRAS_KEYS.summary) || undefined,
      };
    } catch {
      return {};
    }
  },
  [NOSOTRAS_TAG],
  { tags: [NOSOTRAS_TAG], revalidate: 3600 }
);

/** Textos tal como se editan en el admin (con {tienda} sin reemplazar). */
export async function getNosotrasRaw(): Promise<NosotrasContent> {
  const stored = await getStoredNosotras();
  return {
    title: stored.title ?? DEFAULTS.title,
    body: stored.body ?? DEFAULTS.body,
    summary: stored.summary ?? DEFAULTS.summary,
  };
}

/** Textos listos para mostrar en el sitio. */
export async function getNosotrasContent(storeName: string): Promise<NosotrasContent> {
  const raw = await getNosotrasRaw();
  const withName = (s: string) => s.replaceAll("{tienda}", storeName);
  return { title: withName(raw.title), body: withName(raw.body), summary: withName(raw.summary) };
}

/** Divide el texto en párrafos por líneas en blanco. */
export function toParagraphs(body: string): string[] {
  return body.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
}
