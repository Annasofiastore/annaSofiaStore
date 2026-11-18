import { Navbar } from "@/components/storefront/Navbar";
import { Footer } from "@/components/storefront/Footer";
import { FooterGate } from "@/components/storefront/FooterGate";
import { WhatsAppButton } from "@/components/storefront/WhatsAppButton";
import { createServiceClient } from "@/lib/supabase/server";

// Las categorías del menú se refrescan cada 5 minutos (sin esto, cada página se haría dinámica)
export const revalidate = 300;

async function getMenuCategories() {
  try {
    const { data } = await createServiceClient()
      .from("categories")
      .select("id, name, slug")
      .order("sort_order", { ascending: true });
    return data ?? [];
  } catch {
    return [];
  }
}

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const categories = await getMenuCategories();
  return (
    <>
      <Navbar categories={categories} />
      <main className="flex-1 pt-16">{children}</main>
      <FooterGate>
        <Footer />
      </FooterGate>
      <WhatsAppButton />
    </>
  );
}
