import type { MetadataRoute } from "next";
import { createServiceClient } from "@/lib/supabase/server";
import { siteUrl } from "@/lib/config/brand";

// Los productos y colecciones cambian desde el admin: el sitemap se arma en cada consulta
export const dynamic = "force-dynamic";

const STATIC_PAGES: { path: string; priority: number }[] = [
  { path: "", priority: 1 },
  { path: "/catalogo", priority: 0.9 },
  { path: "/colecciones", priority: 0.7 },
  { path: "/best-sellers", priority: 0.7 },
  { path: "/nosotras", priority: 0.5 },
  { path: "/terminos", priority: 0.2 },
  { path: "/privacidad", priority: 0.2 },
  { path: "/devoluciones", priority: 0.2 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const db = createServiceClient();

  const [{ data: products }, { data: collections }] = await Promise.all([
    db.from("products").select("slug, updated_at").eq("status", "active"),
    db.from("collections").select("slug").eq("is_active", true),
  ]);

  return [
    ...STATIC_PAGES.map(({ path, priority }) => ({ url: `${siteUrl}${path}`, priority })),
    ...(collections ?? []).map((c) => ({ url: `${siteUrl}/coleccion/${c.slug}`, priority: 0.6 })),
    ...(products ?? []).map((p) => ({
      url: `${siteUrl}/producto/${p.slug}`,
      lastModified: p.updated_at ?? undefined,
      priority: 0.8,
    })),
  ];
}
