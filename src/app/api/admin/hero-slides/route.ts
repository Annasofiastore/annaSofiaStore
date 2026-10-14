import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const auth = await createClient();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) return null;
  return user;
}

export async function GET() {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const db = createServiceClient();
  const { data } = await db
    .from("hero_slides")
    .select("id, image_url, alt_text, sort_order")
    .eq("is_active", true)
    .order("sort_order");

  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { image_url, alt_text } = await req.json();
  if (!image_url) return NextResponse.json({ error: "Falta image_url" }, { status: 400 });

  const db = createServiceClient();

  // sort_order = max actual + 1
  const { data: maxRow } = await db
    .from("hero_slides")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const sort_order = (maxRow?.sort_order ?? -1) + 1;

  const { data, error } = await db
    .from("hero_slides")
    .insert({ image_url, alt_text: alt_text ?? null, sort_order })
    .select("id, image_url, alt_text, sort_order")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PUT(req: NextRequest) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id, sort_order } = await req.json();
  if (!id || sort_order == null) return NextResponse.json({ error: "Faltan datos" }, { status: 400 });

  const db = createServiceClient();
  const { error } = await db.from("hero_slides").update({ sort_order }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "Falta el ID" }, { status: 400 });

  const db = createServiceClient();
  const { error } = await db.from("hero_slides").update({ is_active: false }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
