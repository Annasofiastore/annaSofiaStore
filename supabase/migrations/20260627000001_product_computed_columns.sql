-- Columnas computadas para productos
-- is_on_sale y effective_price como columnas generadas
-- is_sold_out mantenida por trigger en product_variants

-- 1. is_on_sale: true cuando hay precio anterior mayor al precio actual
alter table products
  add column if not exists is_on_sale boolean
  generated always as (
    compare_price is not null and compare_price > base_price
  ) stored;

-- 2. effective_price: precio de venta actual (= base_price en la estructura actual)
alter table products
  add column if not exists effective_price numeric(12,2)
  generated always as (base_price) stored;

-- 3. is_sold_out: true cuando todas las variantes están sin stock disponible
alter table products
  add column if not exists is_sold_out boolean not null default false;

-- Poblar is_sold_out con el estado actual
update products p
set is_sold_out = not exists (
  select 1 from product_variants pv
  where pv.product_id = p.id
    and (pv.stock - pv.reserved) > 0
);

-- Función que actualiza is_sold_out en el producto padre
create or replace function sync_product_sold_out()
returns trigger language plpgsql as $$
declare
  v_product_id uuid;
begin
  v_product_id := coalesce(new.product_id, old.product_id);

  update products
  set is_sold_out = not exists (
    select 1 from product_variants
    where product_id = v_product_id
      and (stock - reserved) > 0
  )
  where id = v_product_id;

  return null;
end;
$$;

-- Trigger en product_variants para mantener is_sold_out sincronizado
drop trigger if exists trg_sync_product_sold_out on product_variants;
create trigger trg_sync_product_sold_out
  after insert or update of stock, reserved or delete
  on product_variants
  for each row execute function sync_product_sold_out();
