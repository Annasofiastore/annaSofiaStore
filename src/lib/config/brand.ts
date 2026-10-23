/**
 * Identidad de la tienda — ÚNICO archivo a editar al instalar para un cliente nuevo.
 *
 * Todo lo que aparece aquí se propaga al storefront, al admin y a los correos.
 * Lo que NO vive aquí y también hay que personalizar por cliente:
 *   - Paleta y tipografía  → src/app/globals.css + src/app/layout.tsx
 *   - Textos legales       → src/app/{terminos,privacidad,devoluciones}/page.tsx
 *   - Historia y equipo    → src/app/(storefront)/nosotras/page.tsx
 *   - Imágenes             → public/
 *   - Credenciales         → .env.local (ver .env.example)
 *
 * Checklist completo de instalación: INSTALACION.md
 */

export const brand = {
  /**
   * Nombre comercial por defecto. La tienda lo cambia en /admin/configuracion;
   * en código leerlo con getStoreName() (servidor) o useStoreName() (cliente).
   */
  name: "Nombre Boutique",
  /** Versión corta para espacios estrechos (sidebar del admin, etc.). */
  shortName: "Boutique",
  /** Identificador en kebab-case. Llaves de localStorage y nombres de archivos exportados. */
  slug: "boutique",
  /** Frase de marca. Aparece en el <title> y en el footer. */
  tagline: "Tu frase de marca aquí",
  /** Meta description para SEO. 150–160 caracteres. */
  description:
    "Ropa femenina con estilo propio. Prendas versátiles, atemporales y auténticas.",
  /** Keywords para SEO. */
  keywords: ["ropa femenina", "boutique", "moda", "vestidos", "ropa mujer"],

  /** Ciudad y país. Se muestran en el footer y los correos. */
  city: "Ciudad",
  country: "Colombia",
  /** Código de locale para Open Graph. */
  locale: "es_CO",

  /** Dominio sin protocolo. Para mostrar en los correos. */
  domain: "ejemplo.com",
  /** Correo de contacto público. */
  email: "hola@ejemplo.com",
  /** WhatsApp en formato internacional sin "+" ni espacios. */
  whatsapp: "573042114253",

  /** Redes sociales. Dejar en null las que la tienda no tenga. */
  social: {
    instagram: "https://www.instagram.com/annasofiastore1" as string | null,
    facebook: "https://www.facebook.com/profile.php?id=100067127897048" as string | null,
    tiktok: "https://vt.tiktok.com/ZSgDMW1Aj/" as string | null,
  },

  /** Datos legales para términos, privacidad y facturación. */
  legal: {
    /** Razón social registrada. */
    businessName: "Razón Social S.A.S.",
    nit: "000.000.000-0",
    address: "Dirección registrada",
  },
} as const;

/** URL pública del sitio. El env manda; el dominio del brand es el respaldo. */
export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? `https://${brand.domain}`;

/** Enlace de WhatsApp listo para usar en un href. */
export const whatsappUrl = `https://wa.me/${brand.whatsapp}`;

/** Ciudad y país juntos: "Cartagena, Colombia". */
export const location = `${brand.city}, ${brand.country}`;

/** Handle de Instagram ("@tienda") derivado de la URL, o null si no hay cuenta. */
export const instagramHandle = brand.social.instagram
  ? "@" + brand.social.instagram.replace(/\/+$/, "").split("/").pop()
  : null;

/**
 * WhatsApp en formato legible colombiano: "573001234567" → "+57 300 123 4567".
 * Si el número no calza con el patrón de 10 dígitos + indicativo, se devuelve con "+".
 */
export const whatsappDisplay = (() => {
  const m = brand.whatsapp.match(/^(\d{2})(\d{3})(\d{3})(\d{4})$/);
  return m ? `+${m[1]} ${m[2]} ${m[3]} ${m[4]}` : `+${brand.whatsapp}`;
})();
