import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils/format";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const service = await createServiceClient();

  const slug = body.slug || slugify(body.name);

  // 1. Actualizar producto base
  const { error } = await service
    .from("products")
    .update({
      name: body.name,
      slug,
      description: body.description || null,
      care_instructions: body.care_instructions || null,
      base_price: Number(body.base_price),
      compare_price: body.compare_price ? Number(body.compare_price) : null,
      status: body.status,
      is_best_seller: body.is_best_seller ?? false,
      is_pre_sale: body.is_pre_sale ?? false,
      images: body.images ?? [],
    })
    .eq("id", id);

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Ese slug ya existe en otro producto." }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 2. Reemplazar relaciones (delete + insert)
  await Promise.all([
    service.from("product_categories").delete().eq("product_id", id),
    service.from("product_collections").delete().eq("product_id", id),
    service.from("product_occasions").delete().eq("product_id", id),
  ]);

  await Promise.all([
    body.category_ids?.length &&
      service.from("product_categories").insert(
        body.category_ids.map((cid: string) => ({ product_id: id, category_id: cid }))
      ),
    body.collection_ids?.length &&
      service.from("product_collections").insert(
        body.collection_ids.map((cid: string) => ({ product_id: id, collection_id: cid }))
      ),
    body.occasion_ids?.length &&
      service.from("product_occasions").insert(
        body.occasion_ids.map((cid: string) => ({ product_id: id, occasion_id: cid }))
      ),
  ]);

  // 3. Variantes: upsert por SKU, eliminar las que ya no existan
  const incomingSkus: string[] = (body.variants ?? []).map((v: any) => v.sku);

  // Borrar variantes eliminadas
  if (incomingSkus.length > 0) {
    await service
      .from("product_variants")
      .delete()
      .eq("product_id", id)
      .not("sku", "in", `(${incomingSkus.map((s) => `"${s}"`).join(",")})`);
  } else {
    await service.from("product_variants").delete().eq("product_id", id);
  }

  // Upsert variantes
  if (body.variants?.length) {
    await service.from("product_variants").upsert(
      body.variants.map((v: any) => ({
        product_id: id,
        sku: v.sku,
        price: v.price ? Number(v.price) : null,
        stock: Number(v.stock ?? 0),
        attributes: v.attributes,
      })),
      { onConflict: "sku" }
    );
  }

  // 4. Costo al por mayor (tabla privada product_costs). Vacío = borrar el costo.
  if (body.cost_price !== null && body.cost_price !== undefined && body.cost_price !== "") {
    await service
      .from("product_costs")
      .upsert({ product_id: id, cost: Number(body.cost_price), updated_at: new Date().toISOString() });
  } else {
    await service.from("product_costs").delete().eq("product_id", id);
  }

  return NextResponse.json({ id, slug });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const service = await createServiceClient();
  await service.from("products").update({ status: "archived" }).eq("id", id);

  return NextResponse.json({ ok: true });
}
