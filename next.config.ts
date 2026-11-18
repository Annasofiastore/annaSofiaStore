import type { NextConfig } from "next";

// Derivar el hostname de la URL de Supabase para no depender de un valor hardcodeado.
// Si la URL de Supabase cambia, las imágenes siguen funcionando sin tocar este archivo.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseHostname = supabaseUrl
  ? new URL(supabaseUrl).hostname
  : "*.supabase.co";

const nextConfig: NextConfig = {
  // Fija la raíz del workspace para que Next no tome lockfiles sueltos de ~/.
  turbopack: {
    root: __dirname,
  },
  images: {
    // El optimizador de Vercel (plan Hobby) tiene cuota y al agotarse responde 402, dejando las fotos
    // sin cargar. Las fotos ya se suben reducidas (2000 px, WebP), así que se sirven directo desde Supabase.
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: supabaseHostname,
        pathname: "/storage/v1/object/public/**",
      },
      // Fallback por si se usa el formato legacy de Supabase Storage
      {
        protocol: "https",
        hostname: supabaseHostname,
        pathname: "/storage/v1/object/sign/**",
      },
    ],
  },
};

export default nextConfig;
