"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { STORE_NAME_KEY, STORE_NAME_MAX_LENGTH, STORE_NAME_TAG } from "@/lib/config/store-name";
import { NOSOTRAS_KEYS, NOSOTRAS_LIMITS, NOSOTRAS_TAG, type NosotrasContent } from "@/lib/config/nosotras";
import { HERO_KEYS, HERO_LIMITS, HERO_TAG, type HeroContent } from "@/lib/config/hero";

async function isAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user?.app_metadata?.role === "admin";
}

async function saveSettings(entries: Record<string, string>): Promise<string | null> {
  const updated_at = new Date().toISOString();
  const { error } = await createServiceClient()
    .from("site_settings")
    .upsert(
      Object.entries(entries).map(([key, value]) => ({ key, value, updated_at })),
      { onConflict: "key" }
    );
  return error?.message ?? null;
}

export async function updateStoreName(rawName: string): Promise<{ error?: string }> {
  if (!(await isAdmin())) return { error: "No autorizado" };

  const name = rawName.trim().replace(/\s+/g, " ");
  if (!name) return { error: "El nombre no puede estar vacío." };
  if (name.length > STORE_NAME_MAX_LENGTH) {
    return { error: `Máximo ${STORE_NAME_MAX_LENGTH} caracteres.` };
  }

  const error = await saveSettings({ [STORE_NAME_KEY]: name });
  if (error) return { error };

  // El nombre aparece en el layout raíz y la metadata de todas las páginas
  revalidateTag(STORE_NAME_TAG, { expire: 0 });
  revalidatePath("/", "layout");
  return {};
}

export async function updateNosotrasContent(input: NosotrasContent): Promise<{ error?: string }> {
  if (!(await isAdmin())) return { error: "No autorizado" };

  const title = input.title.trim().replace(/\s+/g, " ");
  const summary = input.summary.trim().replace(/\s+/g, " ");
  // El cuerpo conserva los saltos de línea: las líneas en blanco separan párrafos
  const body = input.body.replace(/\r\n/g, "\n").trim();

  if (!title || !body || !summary) return { error: "Completa los tres campos." };
  if (title.length > NOSOTRAS_LIMITS.title) return { error: `El título admite máximo ${NOSOTRAS_LIMITS.title} caracteres.` };
  if (summary.length > NOSOTRAS_LIMITS.summary) return { error: `El resumen admite máximo ${NOSOTRAS_LIMITS.summary} caracteres.` };
  if (body.length > NOSOTRAS_LIMITS.body) return { error: `El texto admite máximo ${NOSOTRAS_LIMITS.body} caracteres.` };

  const error = await saveSettings({
    [NOSOTRAS_KEYS.title]: title,
    [NOSOTRAS_KEYS.body]: body,
    [NOSOTRAS_KEYS.summary]: summary,
  });
  if (error) return { error };

  revalidateTag(NOSOTRAS_TAG, { expire: 0 });
  revalidatePath("/nosotras");
  revalidatePath("/");
  return {};
}

const HERO_LABELS: Record<keyof HeroContent, string> = {
  eyebrow: "La etiqueta",
  title: "El título",
  subtitle: "La frase",
  cta: "El texto del botón",
};

export async function updateHeroContent(input: HeroContent): Promise<{ error?: string }> {
  if (!(await isAdmin())) return { error: "No autorizado" };

  const clean = {} as HeroContent;
  for (const field of Object.keys(HERO_KEYS) as (keyof HeroContent)[]) {
    const value = input[field].trim().replace(/\s+/g, " ");
    if (!value) return { error: "Completa todos los campos." };
    if (value.length > HERO_LIMITS[field]) {
      return { error: `${HERO_LABELS[field]} admite máximo ${HERO_LIMITS[field]} caracteres.` };
    }
    clean[field] = value;
  }

  const error = await saveSettings(
    Object.fromEntries(
      (Object.keys(HERO_KEYS) as (keyof HeroContent)[]).map((f) => [HERO_KEYS[f], clean[f]])
    )
  );
  if (error) return { error };

  revalidateTag(HERO_TAG, { expire: 0 });
  revalidatePath("/");
  return {};
}
