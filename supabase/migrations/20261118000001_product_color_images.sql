-- Foto asociada a cada color de un producto.
-- Formato: {"amarillo": "https://.../foto.jpg", "azul": "https://.../otra.jpg"}
-- (la clave es el nombre del color en minúsculas; el valor es una de las URLs de products.images)
alter table products
  add column if not exists color_images jsonb not null default '{}'::jsonb;
