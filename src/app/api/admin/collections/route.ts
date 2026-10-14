import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

// GET — listar todas las colecciones
export async function GET() {
  const auth = await createClient();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const db = createServiceClient();
  const { data, error } = await db
    .from("collections")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

// POST — crear colección
export async function POST(req: NextRequest) {
  const auth = await createClient();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const db = createServiceClient();

  // Si se destaca en inicio, quitar el destacado de las demás primero
  if (body.featured_on_home) {
    await db.from("collections").update({ featured_on_home: false }).neq("id", "00000000-0000-0000-0000-000000000000");
  }

  const { data, error } = await db.from("collections").insert(body).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// PUT — actualizar colección
export async function PUT(req: NextRequest) {
  const auth = await createClient();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id, ...body } = await req.json();
  if (!id) return NextResponse.json({ error: "Falta el ID" }, { status: 400 });

  const db = createServiceClient();

  // Si se destaca en inicio, quitar el destacado de las demás primero
  if (body.featured_on_home) {
    await db.from("collections").update({ featured_on_home: false }).neq("id", id);
  }

  const { error } = await db.from("collections").update(body).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// DELETE — eliminar colección
export async function DELETE(req: NextRequest) {
  const auth = await createClient();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await req.json();
  const db = createServiceClient();
  const { error } = await db.from("collections").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// PATCH — toggle is_active
export async function PATCH(req: NextRequest) {
  const auth = await createClient();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id, is_active } = await req.json();
  const db = createServiceClient();
  const { error } = await db.from("collections").update({ is_active }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
