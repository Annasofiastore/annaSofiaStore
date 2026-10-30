import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getShippingZone } from "@/lib/checkout/shipping";

// GET /api/shipping/zone?city=Cartagena
// Retorna la zona y precio de envío para una ciudad dada
export async function GET(req: NextRequest) {
  const city = req.nextUrl.searchParams.get("city")?.trim();
  if (!city) return NextResponse.json({ error: "city requerido" }, { status: 400 });

  const zone = await getShippingZone(createServiceClient(), city);
  if (!zone) return NextResponse.json({ error: "Zona no encontrada" }, { status: 404 });

  return NextResponse.json({
    zone_id: zone.id,
    code: zone.code,
    name: zone.name,
    price: zone.price,
  });
}
