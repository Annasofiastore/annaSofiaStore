import { unstable_cache } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * Textos del banner del inicio, editables desde /admin/configuracion.
 * Se guardan en site_settings; los vacíos usan el respaldo de abajo.
 * Solo servidor.
 */

export const HERO_TAG = "hero";

export const HERO_KEYS = {
  eyebrow: "hero_eyebrow",
  title: "hero_title",
  subtitle: "hero_subtitle",
  cta: "hero_cta",
} as const;

export const HERO_LIMITS = { eyebrow: 40, title: 80, subtitle: 160, cta: 30 } as const;

export type HeroContent = { eyebrow: string; title: string; subtitle: string; cta: string };

/** {tienda} se reemplaza por el nombre de la tienda. */
const DEFAULTS: HeroContent = {
  eyebrow: "Nueva colección",
  title: "Brilla a tu manera",
  subtitle: "Prendas femeninas y versátiles para cada momento.",
  cta: "Comprar ahora",
};

const getStoredHero = unstable_cache(
  async (): Promise<Partial<HeroContent>> => {
    try {
      const { data } = await createServiceClient()
        .from("site_settings")
        .select("key, value")
        .in("key", Object.values(HERO_KEYS));
      const byKey = new Map((data ?? []).map((r) => [r.key, r.value?.trim() ?? ""]));
      const stored: Partial<HeroContent> = {};
      for (const [field, key] of Object.entries(HERO_KEYS) as [keyof HeroContent, string][]) {
        const value = byKey.get(key);
        if (value) stored[field] = value;
      }
      return stored;
    } catch {
      return {};
    }
  },
  [HERO_TAG],
  { tags: [HERO_TAG], revalidate: 3600 }
);

/** Textos tal como se editan en el admin (con {tienda} sin reemplazar). */
export async function getHeroRaw(): Promise<HeroContent> {
  return { ...DEFAULTS, ...(await getStoredHero()) };
}

/** Textos listos para mostrar en el sitio. */
export async function getHeroContent(storeName: string): Promise<HeroContent> {
  const raw = await getHeroRaw();
  const withName = (s: string) => s.replaceAll("{tienda}", storeName);
  return {
    eyebrow: withName(raw.eyebrow),
    title: withName(raw.title),
    subtitle: withName(raw.subtitle),
    cta: withName(raw.cta),
  };
}
