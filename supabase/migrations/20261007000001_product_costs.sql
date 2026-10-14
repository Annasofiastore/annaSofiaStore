-- Costo al por mayor de cada producto, para el inventario valorizado
--
-- Va en una tabla aparte y no como columna de products a propósito: products
-- tiene lectura pública (products_public_read) y cualquier columna nueva quedaría
-- expuesta por la API de Supabase con la anon key. Aquí RLS está activo y sin
-- políticas, así que solo el service role (las rutas /api/admin) puede leerla.
--
-- El costo es por producto: todas las variantes (talla/color) comparten el costo
-- de compra. El precio de venta sí puede variar por variante (product_variants.price).

create table if not exists product_costs (
  product_id  uuid primary key references products(id) on delete cascade,
  cost        numeric(12,2) not null check (cost >= 0),
  updated_at  timestamptz not null default now()
);

alter table product_costs enable row level security;

revoke all on product_costs from anon, authenticated;
