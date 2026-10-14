import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils/format";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const service = await createServiceClient();

  const slug = body.slug || slugify(body.name);

  // 1. Crear producto
  const { data: product, error } = await service
    .from("products")
    .insert({
      name: body.name,
      slug,
      description: body.description || null,
      care_instructions: body.care_instructions || null,
      base_price: Number(body.base_price),
      compare_price: body.compare_price ? Number(body.compare_price) : null,
      status: body.status ?? "draft",
      is_best_seller: body.is_best_seller ?? false,
      is_pre_sale: body.is_pre_sale ?? false,
      images: body.images ?? [],
    })
    .select("id")
    .single();

  if (error || !product) {
    if (error?.code === "23505") {
      return NextResponse.json({ error: "Ya existe un producto con ese slug." }, { status: 409 });
    }
    return NextResponse.json({ error: error?.message ?? "Error al crear producto" }, { status: 500 });
  }

  const pid = product.id;

  // 2. Relaciones taxonomía
  await Promise.all([
    body.category_ids?.length &&
      service.from("product_categories").insert(
        body.category_ids.map((id: string) => ({ product_id: pid, category_id: id }))
      ),
    body.collection_ids?.length &&
      service.from("product_collections").insert(
        body.collection_ids.map((id: string) => ({ product_id: pid, collection_id: id }))
      ),
    body.occasion_ids?.length &&
      service.from("product_occasions").insert(
        body.occasion_ids.map((id: string) => ({ product_id: pid, occasion_id: id }))
      ),
  ]);

  // 3. Variantes
  if (body.variants?.length) {
    const { error: variantError } = await service.from("product_variants").insert(
      body.variants.map((v: any) => ({
        product_id: pid,
        sku: v.sku,
        price: v.price ? Number(v.price) : null,
        stock: Number(v.stock ?? 0),
        reserved: 0,
        attributes: v.attributes,
      }))
    );

    // El SKU es unique en toda la tabla. Sin este control el producto quedaba
    // creado y sin variantes, con respuesta 200: un fallo invisible.
    if (variantError) {
      await service.from("products").delete().eq("id", pid);
      if (variantError.code === "23505") {
        return NextResponse.json(
          { error: "Uno de los SKU ya existe en otro producto. Revisa la columna SKU de las variantes." },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: variantError.message }, { status: 500 });
    }
  }

  // 4. Costo al por mayor (tabla privada product_costs). Vacío = sin registrar.
  if (body.cost_price !== null && body.cost_price !== undefined && body.cost_price !== "") {
    await service
      .from("product_costs")
      .upsert({ product_id: pid, cost: Number(body.cost_price), updated_at: new Date().toISOString() });
  }

  // Log de auditoría
  await service.from("stock_movements").insert(
    (body.variants ?? [])
      .filter((v: any) => Number(v.stock) > 0)
      .map((v: any) => ({
        variant_id: null, // se actualizará abajo
        type: "purchase",
        quantity: Number(v.stock),
        notes: `Stock inicial — producto ${slug}`,
        changed_by: user.id,
      }))
  );

  return NextResponse.json({ id: pid, slug });
}
