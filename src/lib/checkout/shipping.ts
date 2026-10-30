import type { createServiceClient } from "@/lib/supabase/server";

type Db = ReturnType<typeof createServiceClient>;

export type ShippingZone = { id: string; code: string; name: string; price: number };

/** Escapa %, _ y \ para que el nombre de la ciudad se compare literalmente en ilike. */
function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (ch) => `\\${ch}`);
}

/**
 * Zona de envío de una ciudad: la que tenga asignada o, si no tiene, la de "municipios".
 * Devuelve null solo si la base no tiene zonas configuradas.
 */
export async function getShippingZone(db: Db, city: string): Promise<ShippingZone | null> {
  const name = city.trim();

  if (name) {
    const { data: cityRow } = await db
      .from("shipping_zone_cities")
      .select("zone_id")
      .ilike("city_name", escapeLike(name))
      .maybeSingle();

    if (cityRow) {
      const { data } = await db
        .from("shipping_zones")
        .select("id, code, name, price")
        .eq("id", cityRow.zone_id)
        .single();
      if (data) return { ...data, price: Number(data.price) };
    }
  }

  const { data } = await db
    .from("shipping_zones")
    .select("id, code, name, price")
    .eq("code", "municipalities")
    .single();
  return data ? { ...data, price: Number(data.price) } : null;
}
