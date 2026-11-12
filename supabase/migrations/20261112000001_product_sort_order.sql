-- Orden manual del catálogo. Menor número = aparece antes.
-- Los productos nuevos entran con 0, así que salen primero (igual que antes, por fecha) hasta que el admin los ordene.
alter table products
  add column if not exists sort_order integer not null default 0;

-- Conserva el orden actual (más nuevos primero) para los productos que ya existen.
with ranked as (
  select id, row_number() over (order by created_at desc) as rn
  from products
)
update products p set sort_order = ranked.rn
from ranked
where p.id = ranked.id and p.sort_order = 0;

create index if not exists idx_products_sort_order on products (sort_order);
