-- Políticas de Storage para el bucket product-images

-- Lectura pública: cualquiera puede ver las imágenes de productos
create policy "product_images_public_read"
  on storage.objects for select
  using (bucket_id = 'product-images');

-- Upload: solo service_role (admin API interna)
create policy "product_images_service_insert"
  on storage.objects for insert
  to service_role
  with check (bucket_id = 'product-images');

-- Delete: solo service_role
create policy "product_images_service_delete"
  on storage.objects for delete
  to service_role
  using (bucket_id = 'product-images');
