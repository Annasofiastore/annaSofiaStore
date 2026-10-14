import { unstable_cache } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import { brand } from "./brand";

/**
 * Nombre de la tienda editable desde /admin/configuracion.
 * Se guarda en site_settings; si no hay valor, se usa brand.name como respaldo.
 * Solo servidor — en Client Components usar useStoreName().
 */

export const STORE_NAME_KEY = "store_name";
export const STORE_NAME_TAG = "store-name";
export const STORE_NAME_MAX_LENGTH = 60;

export const getStoreName = unstable_cache(
  async (): Promise<string> => {
    try {
      const { data } = await createServiceClient()
        .from("site_settings")
        .select("value")
        .eq("key", STORE_NAME_KEY)
        .maybeSingle();
      return data?.value?.trim() || brand.name;
    } catch {
      return brand.name;
    }
  },
  [STORE_NAME_TAG],
  // revalidate como red de seguridad: si la BD no respondió en el build, el respaldo no queda fijo
  { tags: [STORE_NAME_TAG], revalidate: 3600 }
);
