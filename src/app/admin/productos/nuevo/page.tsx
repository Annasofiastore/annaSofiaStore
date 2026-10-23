import { createServiceClient } from "@/lib/supabase/server";
import { ProductForm } from "@/components/admin/ProductForm";

export default async function NuevoProductoPage() {
  const service = await createServiceClient();

  const [{ data: categories }, { data: collections }, { data: occasions }] =
    await Promise.all([
      service.from("categories").select("id, name, slug").order("name"),
      service.from("collections").select("id, name, slug").order("name"),
      service.from("occasions").select("id, name, slug").order("name"),
    ]);

  return (
    <div>
      <div className="mb-6">
        <h1
          className="text-3xl text-[#1F1B19]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Nuevo producto
        </h1>
        <p className="text-sm text-[#766A63] mt-1">
          Completa la información para agregar un producto al catálogo.
        </p>
      </div>

      <ProductForm
        categories={categories ?? []}
        collections={collections ?? []}
        occasions={occasions ?? []}
      />
    </div>
  );
}
