import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { ProductCard } from "@/components/storefront/ProductCard";
import type { Product } from "@/types";
import { getStoreName } from "@/lib/config/store-name";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("collections")
    .select("name, description")
    .eq("slug", slug)
    .single();
  if (!data) return { title: "Colección no encontrada" };
  return {
    title: data.name,
    description: data.description ?? `Explora la colección ${data.name} de ${await getStoreName()}`,
  };
}

export default async function ColeccionPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: collection } = await supabase
    .from("collections")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (!collection) notFound();

  const { data: productLinks } = await supabase
    .from("product_collections")
    .select(`
      sort_order,
      products:product_id (
        *,
        variants:product_variants(*)
      )
    `)
    .eq("collection_id", collection.id)
    .order("sort_order", { ascending: true });

  const products: Product[] = (productLinks ?? [])
    .map((l: any) => l.products)
    .filter((p: any) => p && p.status === "active");

  return (
    <>
      {/* Hero de colección */}
      <section
        className="relative min-h-[40vh] flex items-end justify-start overflow-hidden"
        style={{
          background: collection.hero_url
            ? `linear-gradient(to top, #1E1B2ECC, transparent), url(${collection.hero_url}) center/cover`
            : "linear-gradient(135deg, #F2D4DC 0%, #FAF6F7 50%, #D9C3CE 100%)",
        }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-10">
          <span
            className={`text-[10px] tracking-[0.28em] uppercase font-[500] ${
              collection.hero_url ? "text-[#F2D4DC]" : "text-[#A0647E]"
            }`}
          >
            Colección
          </span>
          <h1
            className={`text-5xl mt-1 ${
              collection.hero_url ? "text-white" : "text-[#1E1B2E]"
            }`}
            style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic" }}
          >
            {collection.name}
          </h1>
          {collection.description && (
            <p
              className={`text-sm mt-2 max-w-md font-[300] ${
                collection.hero_url ? "text-[#FAF6F7]/80" : "text-[#6E6680]"
              }`}
            >
              {collection.description}
            </p>
          )}
        </div>
      </section>

      {/* Productos */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        {products.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-sm text-[#6E6680]">
              Esta colección no tiene productos disponibles aún.
            </p>
          </div>
        ) : (
          <>
            <p className="text-xs text-[#6E6680] mb-6">
              {products.length} {products.length === 1 ? "prenda" : "prendas"}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </>
        )}
      </section>
    </>
  );
}
