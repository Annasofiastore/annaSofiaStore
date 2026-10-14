import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

const ACCENTS: Record<string, string> = {
  á: "a", é: "e", í: "i", ó: "o", ú: "u", ñ: "n", ü: "u",
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .split("")
    .map((ch) => ACCENTS[ch] ?? ch)
    .join("")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

async function requireAdmin() {
  const auth = await createClient();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) return null;
  return user;
}

// GET — todas las zonas con sus ciudades
export async function GET() {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const db = createServiceClient();
  const { data: zones } = await db
    .from("shipping_zones")
    .select("*, cities:shipping_zone_cities(id, city_name)")
    .order("sort_order");

  return NextResponse.json(zones ?? []);
}

// PUT — actualizar precio de una zona
export async function PUT(req: NextRequest) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id, price } = await req.json();
  if (!id || price == null) return NextResponse.json({ error: "Faltan datos" }, { status: 400 });

  const db = createServiceClient();
  const { error } = await db
    .from("shipping_zones")
    .update({ price: Number(price), updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// POST — crear una zona nueva, o agregar ciudad a una zona existente
export async function POST(req: NextRequest) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const db = createServiceClient();

  // Crear zona — se identifica por traer "name" y no "zone_id"
  if (body.name && !body.zone_id) {
    const name = String(body.name).trim();
    const price = Number(body.price);
    if (!name || Number.isNaN(price) || price < 0) {
      return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
    }

    const baseCode = slugify(name) || "zona";

    let code = baseCode;
    let suffix = 1;
    while (true) {
      const { data: existing } = await db.from("shipping_zones").select("id").eq("code", code).maybeSingle();
      if (!existing) break;
      code = `${baseCode}_${++suffix}`;
    }

    // La zona "Municipios" (fallback) siempre debe quedar al final
    const { data: fallback } = await db
      .from("shipping_zones")
      .select("id, sort_order")
      .eq("code", "municipalities")
      .maybeSingle();

    const newSortOrder = fallback?.sort_order ?? 999;

    const { data: created, error } = await db
      .from("shipping_zones")
      .insert({
        code,
        name,
        description: body.description?.trim() || null,
        price,
        sort_order: newSortOrder,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    if (fallback) {
      await db.from("shipping_zones").update({ sort_order: newSortOrder + 1 }).eq("id", fallback.id);
    }

    return NextResponse.json({ ok: true, zone: created });
  }

  // Agregar ciudad a una zona existente
  const { zone_id, city_name } = body;
  if (!zone_id || !city_name?.trim()) return NextResponse.json({ error: "Faltan datos" }, { status: 400 });

  const { error } = await db
    .from("shipping_zone_cities")
    .insert({ zone_id, city_name: city_name.trim() });

  if (error) {
    if (error.code === "23505") return NextResponse.json({ error: "Esa ciudad ya está asignada" }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

// DELETE — quitar ciudad de una zona
export async function DELETE(req: NextRequest) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "Falta el ID" }, { status: 400 });

  const db = createServiceClient();
  const { error } = await db.from("shipping_zone_cities").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
