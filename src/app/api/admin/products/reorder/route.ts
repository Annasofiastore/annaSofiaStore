import { isAdminUser } from "@/lib/auth/admin";
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient, createServiceClient } from "@/lib/supabase/server";

// POST { ids: string[] } — el primer id queda de primero en el catálogo.
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!isAdminUser(user)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { ids } = await req.json();
  if (!Array.isArray(ids) || !ids.length || ids.length > 500 || ids.some((i) => typeof i !== "string")) {
    return NextResponse.json({ error: "Lista de productos inválida" }, { status: 400 });
  }

  const service = await createServiceClient();
  const results = await Promise.all(
    ids.map((id: string, i: number) => service.from("products").update({ sort_order: i + 1 }).eq("id", id)),
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) return NextResponse.json({ error: failed.error.message }, { status: 500 });

  revalidatePath("/catalogo");
  return NextResponse.json({ ok: true });
}
