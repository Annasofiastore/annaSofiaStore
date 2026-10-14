-- Garantiza que el bucket product-images existe y es PÚBLICO.
-- Si ya existe, lo actualiza para que sea público.
-- Si no existe, lo crea con la configuración correcta.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  20971520,
  ARRAY[
    'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
    'image/gif', 'image/heic', 'image/heif', 'image/avif'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public           = true,
  file_size_limit  = 20971520,
  allowed_mime_types = ARRAY[
    'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
    'image/gif', 'image/heic', 'image/heif', 'image/avif'
  ];

-- Recrear políticas limpias (drop + create para garantizar que existen)
DROP POLICY IF EXISTS "product_images_public_read"    ON storage.objects;
DROP POLICY IF EXISTS "product_images_service_insert" ON storage.objects;
DROP POLICY IF EXISTS "product_images_service_delete" ON storage.objects;
DROP POLICY IF EXISTS "product_images_service_update" ON storage.objects;

-- Lectura pública: cualquiera puede ver las imágenes
CREATE POLICY "product_images_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

-- Solo service_role puede subir, actualizar y eliminar
CREATE POLICY "product_images_service_insert"
  ON storage.objects FOR INSERT
  TO service_role
  WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "product_images_service_update"
  ON storage.objects FOR UPDATE
  TO service_role
  USING (bucket_id = 'product-images');

CREATE POLICY "product_images_service_delete"
  ON storage.objects FOR DELETE
  TO service_role
  USING (bucket_id = 'product-images');
