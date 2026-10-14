import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

const BUCKET = "product-images";
const MIME_TYPES = [
  "image/jpeg", "image/jpg", "image/png", "image/webp",
  "image/gif", "image/heic", "image/heif", "image/avif",
];

export async function GET() {
  const auth = await createClient();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const db = createServiceClient();
  const fixes: string[] = [];

  // 1. Intentar crear el bucket (no falla si ya existe)
  const { error: createErr } = await db.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: 20 * 1024 * 1024,
    allowedMimeTypes: MIME_TYPES,
  });
  if (!createErr) fixes.push("Bucket creado como público");

  // 2. Forzar public=true sobre el bucket existente
  const { error: updateErr } = await db.storage.updateBucket(BUCKET, {
    public: true,
    fileSizeLimit: 20 * 1024 * 1024,
    allowedMimeTypes: MIME_TYPES,
  });
  if (!updateErr) fixes.push("Bucket actualizado a público");
  else fixes.push(`updateBucket error: ${updateErr.message}`);

  // 3. Estado real del bucket después del fix
  const { data: bucket } = await db.storage.getBucket(BUCKET);

  // 4. Listar archivos de muestra
  const { data: files } = await db.storage.from(BUCKET).list("products", { limit: 5 });
  const { data: heroFiles } = await db.storage.from(BUCKET).list("", { limit: 5 });

  // 5. URL de muestra para test manual
  let sampleUrl: string | null = null;
  const firstFile = files?.[0];
  if (firstFile) {
    const { data: { publicUrl } } = db.storage
      .from(BUCKET)
      .getPublicUrl(`products/${firstFile.name}`);
    sampleUrl = publicUrl;
  }

  return NextResponse.json({
    fixes,
    bucket: bucket
      ? { id: bucket.id, public: bucket.public, fileSizeLimit: bucket.file_size_limit }
      : null,
    productsFolder: files?.length ?? 0,
    rootFolder: heroFiles?.length ?? 0,
    sampleUrl,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "NOT SET",
    nextConfigHostname: (() => {
      try { return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").hostname; } catch { return "invalid"; }
    })(),
  });
}
