import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import { ProductForm } from "@/components/admin/ProductForm";
import { ArchiveProductButton } from "@/components/admin/ArchiveProductButton";

type Props = { params: Promise<{ id: string }> };

export default async function EditarProductoPage({ params }: Props) {
  const { id } = await params;
  const service = await createServiceClient();

  const [
    { data: product },
    { data: categories },
    { data: collections },
    { data: occasions },
    { data: cost },
  ] = await Promise.all([
    service
      .from("products")
      .select(
        `id, name, slug, description, care_instructions, base_price, compare_price, status, is_best_seller, is_pre_sale, images,
         product_categories(category_id),
         product_collections(collection_id),
         product_occasions(occasion_id),
         product_variants(sku, price, stock, attributes)`
      )
      .eq("id", id)
      .single(),
    service.from("categories").select("id, name, slug").order("name"),
    service.from("collections").select("id, name, slug").order("name"),
    service.from("occasions").select("id, name, slug").order("name"),
    service.from("product_costs").select("cost").eq("product_id", id).maybeSingle(),
  ]);

  if (!product) notFound();

  const initial = {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description ?? "",
    care_instructions: product.care_instructions ?? "",
    base_price: String(product.base_price),
    compare_price: product.compare_price ? String(product.compare_price) : "",
    cost_price: cost ? String(cost.cost) : "",
    status: product.status as "draft" | "active" | "archived",
    is_best_seller: product.is_best_seller ?? false,
    is_pre_sale: product.is_pre_sale ?? false,
    images: product.images ?? [],
    category_ids: (product.product_categories ?? []).map((r: any) => r.category_id),
    collection_ids: (product.product_collections ?? []).map((r: any) => r.collection_id),
    occasion_ids: (product.product_occasions ?? []).map((r: any) => r.occasion_id),
    variants: (product.product_variants ?? []).map((v: any) => ({
      sku: v.sku,
      attributes: v.attributes,
      stock: v.stock,
      price: v.price,
    })),
  };

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1
            className="text-3xl text-[#1E1B2E]"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Editar producto
          </h1>
          <p className="text-sm text-[#6E6680] mt-1">{product.name}</p>
        </div>
        <ArchiveProductButton id={id} />
      </div>

      <ProductForm
        initial={initial}
        categories={categories ?? []}
        collections={collections ?? []}
        occasions={occasions ?? []}
      />
    </div>
  );
}
