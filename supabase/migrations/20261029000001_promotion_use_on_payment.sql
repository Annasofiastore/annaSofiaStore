-- Registro del uso de un cupón cuando el pedido queda pagado.
--
-- Hasta ahora ningún proceso escribía promotion_uses ni promotions.used_count, así que los límites
-- de usos (totales y por clienta) nunca se aplicaban. El pedido guarda qué cupón usó y un trigger
-- registra el uso la primera vez que el pedido tiene fecha de pago (paid_at), sin importar quién lo
-- confirmó: webhook, redirect de Wompi, reconciliación, verificación manual o entrega contraentrega.

-- 1. El pedido recuerda qué cupón usó (la columna ya existe en el esquema original; esto es solo por seguridad)
alter table orders
  add column if not exists promotion_id uuid references promotions(id) on delete set null;

create index if not exists idx_orders_promotion
  on orders (promotion_id) where promotion_id is not null;

-- 2. Un solo uso por pedido (hace idempotente el registro)
create unique index if not exists uq_promotion_uses_order
  on promotion_uses (order_id) where order_id is not null;

-- 3. Registra el uso y suma al contador, una sola vez por pedido.
--    security definer: debe funcionar aunque quien actualiza el pedido no pueda escribir en promotion_uses por RLS.
create or replace function register_promotion_use_on_payment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inserted integer;
begin
  insert into promotion_uses (promotion_id, customer_id, order_id)
  values (new.promotion_id, new.customer_id, new.id)
  on conflict (order_id) where order_id is not null do nothing;

  get diagnostics v_inserted = row_count;

  if v_inserted > 0 then
    update promotions set used_count = used_count + 1 where id = new.promotion_id;
  end if;

  return new;
end;
$$;

-- Pedido que nace ya pagado (hoy, contraentrega)
drop trigger if exists trg_promotion_use_on_insert on orders;
create trigger trg_promotion_use_on_insert
  after insert on orders
  for each row
  when (new.promotion_id is not null and new.paid_at is not null)
  execute function register_promotion_use_on_payment();

-- Pedido que pasa a pagado después (Wompi, o contraentrega al entregarse)
drop trigger if exists trg_promotion_use_on_paid on orders;
create trigger trg_promotion_use_on_paid
  after update of paid_at on orders
  for each row
  when (new.promotion_id is not null and old.paid_at is null and new.paid_at is not null)
  execute function register_promotion_use_on_payment();
