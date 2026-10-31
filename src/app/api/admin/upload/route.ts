import { isAdminUser } from "@/lib/auth/admin";
import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { createClient, createServiceClient } from "@/lib/supabase/server";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const heicConvert = require("heic-convert");

const MAX_SIZE = 20 * 1024 * 1024; // 20 MB

// Las fotos se reducen antes de guardarlas: lado largo máximo y calidad WebP.
const MAX_DIMENSION = 2000;
const WEBP_QUALITY = 82;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!isAdminUser(user)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) return NextResponse.json({ error: "Sin archivo" }, { status: 400 });

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const isHeic = file.type === "image/heic" || file.type === "image/heif" || ext === "heic" || ext === "heif";

  if (!file.type.startsWith("image/") && !isHeic) {
    return NextResponse.json({ error: "Solo se aceptan imágenes" }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "Máximo 20 MB por imagen" }, { status: 400 });
  }

  let buffer: Buffer = Buffer.from(await file.arrayBuffer());
  let contentType = file.type;
  let uploadExt = ext;

  if (isHeic) {
    try {
      const converted: ArrayBuffer = await heicConvert({ buffer, format: "JPEG", quality: 0.9 });
      buffer = Buffer.from(converted);
      contentType = "image/jpeg";
      uploadExt = "jpg";
    } catch {
      return NextResponse.json({ error: "No se pudo convertir el archivo HEIC" }, { status: 400 });
    }
  }

  // Reducir y pasar a WebP. Los GIF se dejan tal cual para no perder la animación.
  if (contentType !== "image/gif") {
    try {
      buffer = await sharp(buffer)
        .rotate() // aplica la orientación EXIF de las fotos de celular
        .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: "inside", withoutEnlargement: true })
        .webp({ quality: WEBP_QUALITY })
        .toBuffer();
      contentType = "image/webp";
      uploadExt = "webp";
    } catch {
      return NextResponse.json({ error: "No se pudo procesar la imagen" }, { status: 400 });
    }
  }

  const prefix = (formData.get("prefix") as string | null) ?? "products";
  const path = `${prefix}/${Date.now()}-${Math.random().toString(36).slice(2)}.${uploadExt}`;

  const service = createServiceClient();

  // Garantizar que el bucket existe y es público antes de subir.
  // Si ya existe lo actualiza; si no existe lo crea.
  await service.storage.createBucket("product-images", {
    public: true,
    fileSizeLimit: 20 * 1024 * 1024,
    allowedMimeTypes: ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif", "image/heic", "image/heif", "image/avif"],
  });
  // Si el bucket ya existe (error 409), lo actualizamos para asegurar public=true
  await service.storage.updateBucket("product-images", {
    public: true,
    fileSizeLimit: 20 * 1024 * 1024,
    allowedMimeTypes: ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif", "image/heic", "image/heif", "image/avif"],
  });

  const { error } = await service.storage
    .from("product-images")
    .upload(path, buffer, { contentType, upsert: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: { publicUrl } } = service.storage
    .from("product-images")
    .getPublicUrl(path);

  // Sanity check: la URL debe contener el hostname de Supabase
  if (!publicUrl || !publicUrl.startsWith("http")) {
    return NextResponse.json({ error: "URL de imagen inválida generada por Storage" }, { status: 500 });
  }

  return NextResponse.json({ url: publicUrl, path });
}
