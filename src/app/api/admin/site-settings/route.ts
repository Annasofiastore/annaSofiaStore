import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const auth = await createClient();
  const { data: { user } } = await auth.auth.getUser();
  if (!user || user.app_metadata?.role !== "admin") return null;
  return user;
}

// GET — todas las configuraciones (o una en particular con ?key=...)
export async function GET(req: NextRequest) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const key = req.nextUrl.searchParams.get("key");
  const db = createServiceClient();

  if (key) {
    const { data } = await db.from("site_settings").select("key, value").eq("key", key).single();
    return NextResponse.json(data ?? { key, value: null });
  }

  const { data } = await db.from("site_settings").select("key, value").order("key");
  return NextResponse.json(data ?? []);
}

// PATCH — actualizar o crear una entrada por clave
export async function PATCH(req: NextRequest) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { key, value } = await req.json();
  if (!key) return NextResponse.json({ error: "Falta la clave" }, { status: 400 });

  const db = createServiceClient();
  const { error } = await db
    .from("site_settings")
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
