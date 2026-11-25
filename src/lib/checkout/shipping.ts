import type { createServiceClient } from "@/lib/supabase/server";

type Db = ReturnType<typeof createServiceClient>;

export type ShippingZone = { id: string; code: string; name: string; price: number };

/** Escapa %, _ y \ para que el nombre de la ciudad se compare literalmente en ilike. */
function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (ch) => `\\${ch}`);
}

const norm = (v: string) => v.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

/**
 * Zona de envío de un municipio: la que tenga asignada o, si no tiene, la de "municipios".
 * Se compara el municipio junto con su departamento: una ciudad asignada con departamento solo aplica a ese
 * departamento; una asignada sin departamento (datos anteriores) aplica a cualquiera.
 * Devuelve null solo si la base no tiene zonas configuradas.
 */
export async function getShippingZone(db: Db, city: string, department?: string | null): Promise<ShippingZone | null> {
  const name = city.trim();

  if (name) {
    const { data: rows } = await db
      .from("shipping_zone_cities")
      .select("zone_id, department")
      .ilike("city_name", escapeLike(name));

    const dept = department ? norm(department) : "";
    const match =
      (dept ? rows?.find((r) => r.department && norm(r.department) === dept) : undefined) ??
      rows?.find((r) => !r.department) ??
      // Sin departamento en la consulta, se usa la primera coincidencia
      (!dept ? rows?.[0] : undefined);

    if (match) {
      const { data } = await db
        .from("shipping_zones")
        .select("id, code, name, price")
        .eq("id", match.zone_id)
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
