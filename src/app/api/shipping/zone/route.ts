import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

// GET /api/shipping/zone?city=Cartagena
// Retorna la zona y precio de envío para una ciudad dada
export async function GET(req: NextRequest) {
  const city = req.nextUrl.searchParams.get("city")?.trim();
  if (!city) return NextResponse.json({ error: "city requerido" }, { status: 400 });

  const db = createServiceClient();

  // Buscar zona por nombre de ciudad (case-insensitive)
  const { data: cityRow } = await db
    .from("shipping_zone_cities")
    .select("zone_id")
    .ilike("city_name", city)
    .maybeSingle();

  let zone;

  if (cityRow) {
    const { data } = await db
      .from("shipping_zones")
      .select("id, code, name, price")
      .eq("id", cityRow.zone_id)
      .single();
    zone = data;
  } else {
    // Fallback: zona de municipios
    const { data } = await db
      .from("shipping_zones")
      .select("id, code, name, price")
      .eq("code", "municipalities")
      .single();
    zone = data;
  }

  if (!zone) return NextResponse.json({ error: "Zona no encontrada" }, { status: 404 });

  return NextResponse.json({
    zone_id: zone.id,
    code: zone.code,
    name: zone.name,
    price: zone.price,
  });
}
