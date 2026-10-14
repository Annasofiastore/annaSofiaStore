import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils/format";
import { parseImportFile, groupByProduct } from "@/lib/utils/importParser";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const previewOnly = formData.get("preview") === "true";

  if (!file) return NextResponse.json({ error: "Sin archivo" }, { status: 400 });

  const ext = file.name.split(".").pop()?.toLowerCase();
  if (!["csv", "xlsx", "xls"].includes(ext ?? "")) {
    return NextResponse.json(
      { error: "Solo se aceptan archivos CSV o Excel (.xlsx, .xls)" },
      { status: 400 }
    );
  }

  const buffer = await file.arrayBuffer();
  const { rows, errors } = parseImportFile(buffer);

  if (errors.length > 0) {
    return NextResponse.json({ ok: false, errors, rows: [] }, { status: 422 });
  }

  const groups = groupByProduct(rows);

  if (previewOnly) {
    return NextResponse.json({ ok: true, preview: groups, total: groups.length });
  }

  // --- Import ---
  const service = await createServiceClient();
  const results: { nombre: string; status: "created" | "error"; message?: string }[] = [];

  // Pre-fetch all taxonomy to resolve names → ids
  const [{ data: cats }, { data: cols }, { data: occs }] = await Promise.all([
    service.from("categories").select("id, name"),
    service.from("collections").select("id, name"),
    service.from("occasions").select("id, name"),
  ]);

  function resolveIds(names: string[], source: { id: string; name: string }[] | null): string[] {
    if (!names.length || !source) return [];
    return names
      .map((n) => source.find((s) => s.name.toLowerCase() === n.toLowerCase())?.id)
      .filter(Boolean) as string[];
  }

  for (const group of groups) {
    try {
      const slug = slugify(group.nombre);
      const category_ids = resolveIds(group.categorias, cats ?? []);
      const collection_ids = resolveIds(group.colecciones, cols ?? []);
      const occasion_ids = resolveIds(group.ocasiones, occs ?? []);

      // 1. Insert product
      const { data: product, error: productError } = await service
        .from("products")
        .insert({
          name: group.nombre,
          slug,
          description: group.descripcion || null,
          care_instructions: group.cuidados || null,
          base_price: group.precio_base,
          compare_price: group.precio_comparacion,
          status: group.estado,
          images: [],
        })
        .select("id")
        .single();

      if (productError || !product) {
        // Duplicate slug → try with suffix
        if (productError?.code === "23505") {
          const { data: product2, error: e2 } = await service
            .from("products")
            .insert({
              name: group.nombre,
              slug: `${slug}-${Date.now().toString(36)}`,
              description: group.descripcion || null,
              care_instructions: group.cuidados || null,
              base_price: group.precio_base,
              compare_price: group.precio_comparacion,
              status: group.estado,
              images: [],
            })
            .select("id")
            .single();
          if (e2 || !product2) throw new Error(e2?.message ?? "Error creando producto");
          Object.assign(product!, product2);
        } else {
          throw new Error(productError?.message ?? "Error creando producto");
        }
      }

      const pid = product!.id;

      // 2. Taxonomy relations
      await Promise.all([
        category_ids.length &&
          service.from("product_categories").insert(
            category_ids.map((id) => ({ product_id: pid, category_id: id }))
          ),
        collection_ids.length &&
          service.from("product_collections").insert(
            collection_ids.map((id) => ({ product_id: pid, collection_id: id }))
          ),
        occasion_ids.length &&
          service.from("product_occasions").insert(
            occasion_ids.map((id) => ({ product_id: pid, occasion_id: id }))
          ),
      ]);

      // 3. Variants
      if (group.variants.length > 0) {
        await service.from("product_variants").insert(
          group.variants.map((v) => ({
            product_id: pid,
            sku: v.sku,
            price: v.precio_variante,
            stock: v.stock,
            reserved: 0,
            attributes: { talla: v.talla, color: v.color },
          }))
        );
      }

      results.push({ nombre: group.nombre, status: "created" });
    } catch (err: any) {
      results.push({ nombre: group.nombre, status: "error", message: err.message });
    }
  }

  const created = results.filter((r) => r.status === "created").length;
  const failed = results.filter((r) => r.status === "error");

  return NextResponse.json({ ok: true, created, failed, total: groups.length });
}
