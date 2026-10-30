import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/config/brand";

// Páginas privadas o transaccionales: no tienen valor en buscadores
const PRIVATE_PATHS = ["/admin", "/api/", "/checkout", "/carrito", "/cuenta", "/auth/", "/confirmacion/", "/seguimiento"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: PRIVATE_PATHS },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
