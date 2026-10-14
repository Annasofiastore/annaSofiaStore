-- ============================================================
-- Esquema inicial de base de datos
-- Versión: 1.0 | Fase 1 MVP
-- ============================================================

-- Habilitar extensiones necesarias
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================

create type product_status as enum ('draft', 'active', 'archived');
create type order_status as enum (
  'pending_payment',
  'paid',
  'preparing',
  'shipped',
  'delivered',
  'cancelled',
  'return_requested',
  'return_in_transit',
  'return_received',
  'refunded'
);
create type discount_type as enum ('percentage', 'fixed');
create type stock_movement_type as enum ('purchase', 'sale', 'adjustment', 'return', 'reservation', 'reservation_released');

-- ============================================================
-- CATEGORÍAS / COLECCIONES / OCASIONES
-- ============================================================

create table categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  description text,
  image_url   text,
  sort_order  integer default 0,
  created_at  timestamptz default now()
);

create table collections (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  description text,
  hero_url    text,
  sort_order  integer default 0,
  is_active   boolean default true,
  created_at  timestamptz default now()
);

create table occasions (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  sort_order  integer default 0,
  created_at  timestamptz default now()
);

-- ============================================================
-- PRODUCTOS
-- ============================================================

create table products (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  slug            text not null unique,
  description     text,
  care_instructions text,
  base_price      numeric(12,2) not null check (base_price >= 0),
  compare_price   numeric(12,2),                -- precio anterior (tachado)
  status          product_status not null default 'draft',
  images          text[] default '{}',          -- URLs en Supabase Storage
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- Relaciones muchos a muchos
create table product_categories (
  product_id  uuid references products(id) on delete cascade,
  category_id uuid references categories(id) on delete cascade,
  primary key (product_id, category_id)
);

create table product_collections (
  product_id    uuid references products(id) on delete cascade,
  collection_id uuid references collections(id) on delete cascade,
  sort_order    integer default 0,
  primary key (product_id, collection_id)
);

create table product_occasions (
  product_id  uuid references products(id) on delete cascade,
  occasion_id uuid references occasions(id) on delete cascade,
  primary key (product_id, occasion_id)
);

-- Dimensiones de variante (talla, color, etc.) — RB-CAT-06
create table variant_attributes (
  id    uuid primary key default gen_random_uuid(),
  name  text not null unique  -- 'talla', 'color', 'estampado', etc.
);

create table variant_attribute_values (
  id           uuid primary key default gen_random_uuid(),
  attribute_id uuid not null references variant_attributes(id) on delete cascade,
  value        text not null,
  display_name text,
  hex_color    text,           -- solo para atributo 'color'
  sort_order   integer default 0,
  unique (attribute_id, value)
);

-- SKUs: cada combinación talla×color es una unidad de inventario — RB-CAT-01
create table product_variants (
  id           uuid primary key default gen_random_uuid(),
  product_id   uuid not null references products(id) on delete cascade,
  sku          text not null unique,
  price        numeric(12,2),  -- null = hereda de products.base_price
  stock        integer not null default 0 check (stock >= 0),
  reserved     integer not null default 0 check (reserved >= 0),
  attributes   jsonb not null default '{}',  -- {"talla":"M","color":"azul"}
  created_at   timestamptz default now()
);

create index idx_product_variants_product on product_variants(product_id);
create index idx_product_variants_sku on product_variants(sku);

-- ============================================================
-- CLIENTES Y PROSPECTOS — RB-CTA-01, RB-CHK-07
-- ============================================================

create table customers (
  id              uuid primary key default gen_random_uuid(),
  auth_user_id    uuid unique,            -- vinculado a auth.users si tiene cuenta
  email           text not null unique,
  full_name       text not null,
  phone           text,
  marketing_email boolean default false,  -- RB-CTA-04
  marketing_whatsapp boolean default false,
  is_guest        boolean default false,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create index idx_customers_email on customers(email);
create index idx_customers_auth_user on customers(auth_user_id);

create table customer_addresses (
  id          uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  label       text default 'Principal',
  full_name   text not null,
  phone       text not null,
  address     text not null,
  city        text not null,
  department  text not null,
  is_default  boolean default false,
  created_at  timestamptz default now()
);

-- ============================================================
-- WISHLIST — RB-WL-01, RB-WL-02
-- ============================================================

create table wishlists (
  id          uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  product_id  uuid not null references products(id) on delete cascade,
  variant_id  uuid references product_variants(id) on delete set null,
  added_at    timestamptz default now(),
  unique (customer_id, product_id)
);

create index idx_wishlists_customer on wishlists(customer_id);
create index idx_wishlists_product on wishlists(product_id);

-- ============================================================
-- DESCUENTOS Y CUPONES — Módulo 8
-- ============================================================

create table promotions (
  id             uuid primary key default gen_random_uuid(),
  code           text unique,                    -- null = descuento automático sin código
  name           text not null,
  discount_type  discount_type not null,
  discount_value numeric(10,2) not null check (discount_value > 0),
  scope          text not null default 'global', -- 'global', 'product', 'collection'
  scope_id       uuid,                           -- product_id o collection_id según scope
  max_uses       integer,                        -- null = ilimitado
  max_uses_per_customer integer default 1,
  used_count     integer not null default 0,
  starts_at      timestamptz not null,
  ends_at        timestamptz not null,
  is_active      boolean default true,
  is_cumulative  boolean default false,          -- RB-PROM-03
  created_at     timestamptz default now()
);

create index idx_promotions_code on promotions(code) where code is not null;
create index idx_promotions_active on promotions(is_active, starts_at, ends_at);

create table promotion_uses (
  id           uuid primary key default gen_random_uuid(),
  promotion_id uuid not null references promotions(id) on delete cascade,
  customer_id  uuid references customers(id) on delete set null,
  order_id     uuid,                             -- referencia circular, se agrega FK después
  used_at      timestamptz default now()
);

-- ============================================================
-- PEDIDOS — Módulo 5
-- ============================================================

create table orders (
  id              uuid primary key default gen_random_uuid(),
  order_number    text not null unique default 'ORD-' || upper(substring(gen_random_uuid()::text, 1, 8)),
  customer_id     uuid references customers(id) on delete set null,
  status          order_status not null default 'pending_payment',

  -- Datos de envío capturados en checkout
  shipping_name       text not null,
  shipping_email      text not null,
  shipping_phone      text not null,
  shipping_address    text not null,
  shipping_city       text not null,
  shipping_department text not null,

  -- Totales
  subtotal        numeric(12,2) not null,
  discount_amount numeric(12,2) not null default 0,
  shipping_cost   numeric(12,2) not null default 0,
  total           numeric(12,2) not null,

  -- Pago
  wompi_transaction_id text,
  wompi_reference      text unique,
  paid_at              timestamptz,

  -- Logística
  tracking_number  text,
  courier          text,
  shipped_at       timestamptz,
  delivered_at     timestamptz,

  -- Descuento aplicado
  promotion_id     uuid references promotions(id) on delete set null,

  -- Consentimiento legal — RB-CHK-08
  terms_accepted   boolean not null default false,
  terms_accepted_at timestamptz,

  notes            text,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

create index idx_orders_customer on orders(customer_id);
create index idx_orders_status on orders(status);
create index idx_orders_order_number on orders(order_number);
create index idx_orders_wompi_ref on orders(wompi_reference);

-- FK circular: promotion_uses.order_id → orders.id
alter table promotion_uses
  add constraint fk_promotion_uses_order
  foreign key (order_id) references orders(id) on delete set null;

create table order_items (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references orders(id) on delete cascade,
  variant_id  uuid not null references product_variants(id) on delete restrict,
  product_id  uuid not null references products(id) on delete restrict,
  product_name text not null,   -- snapshot al momento de compra
  variant_sku  text not null,
  variant_attrs jsonb not null default '{}',
  quantity    integer not null check (quantity > 0),
  unit_price  numeric(12,2) not null,
  total_price numeric(12,2) not null
);

create index idx_order_items_order on order_items(order_id);

-- Log de cambios de estado — RB-PED-04, RB-ADM-02
create table order_status_log (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references orders(id) on delete cascade,
  from_status order_status,
  to_status   order_status not null,
  changed_by  uuid,             -- auth.users.id del admin; null si es automático
  notes       text,
  created_at  timestamptz default now()
);

create index idx_order_status_log_order on order_status_log(order_id);

-- ============================================================
-- RESERVAS DE STOCK — RB-CHK-01, RB-CHK-03
-- ============================================================

create table stock_reservations (
  id          uuid primary key default gen_random_uuid(),
  variant_id  uuid not null references product_variants(id) on delete cascade,
  session_id  text not null,
  quantity    integer not null check (quantity > 0),
  expires_at  timestamptz not null,
  converted   boolean default false,  -- true cuando el pago se confirma
  created_at  timestamptz default now()
);

create index idx_stock_reservations_variant on stock_reservations(variant_id);
create index idx_stock_reservations_expires on stock_reservations(expires_at) where not converted;
create index idx_stock_reservations_session on stock_reservations(session_id);

-- ============================================================
-- MOVIMIENTOS DE INVENTARIO — Auditoría de stock
-- ============================================================

create table stock_movements (
  id          uuid primary key default gen_random_uuid(),
  variant_id  uuid references product_variants(id) on delete cascade,
  type        stock_movement_type not null,
  quantity    integer not null,           -- positivo = entrada, negativo = salida
  reference   text,                       -- order_id, ajuste manual, etc.
  notes       text,
  changed_by  uuid,
  created_at  timestamptz default now()
);

create index idx_stock_movements_variant on stock_movements(variant_id);

-- ============================================================
-- FUNCIONES Y TRIGGERS
-- ============================================================

-- Actualizar updated_at automáticamente
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_products_updated_at
  before update on products
  for each row execute function set_updated_at();

create trigger trg_customers_updated_at
  before update on customers
  for each row execute function set_updated_at();

create trigger trg_orders_updated_at
  before update on orders
  for each row execute function set_updated_at();

-- Liberar reservas expiradas: llamar desde cron/backend — RB-CHK-01, RB-PED-02
create or replace function release_expired_reservations()
returns void language plpgsql as $$
declare
  r stock_reservations%rowtype;
begin
  for r in
    select * from stock_reservations
    where expires_at < now() and not converted
    for update skip locked
  loop
    -- Restaurar stock en la variante
    update product_variants
    set reserved = greatest(0, reserved - r.quantity)
    where id = r.variant_id;

    -- Registrar movimiento
    insert into stock_movements(variant_id, type, quantity, reference, notes)
    values (r.variant_id, 'reservation_released', r.quantity, r.session_id, 'Reserva expirada automáticamente');

    -- Eliminar la reserva
    delete from stock_reservations where id = r.id;
  end loop;
end;
$$;

-- Reservar stock de forma atómica — RB-CHK-03
create or replace function reserve_stock(
  p_variant_id uuid,
  p_session_id text,
  p_quantity   integer,
  p_minutes    integer default 10
) returns boolean language plpgsql as $$
declare
  v_available integer;
begin
  select (stock - reserved) into v_available
  from product_variants
  where id = p_variant_id
  for update;

  if v_available < p_quantity then
    return false;
  end if;

  update product_variants
  set reserved = reserved + p_quantity
  where id = p_variant_id;

  insert into stock_reservations(variant_id, session_id, quantity, expires_at)
  values (p_variant_id, p_session_id, p_quantity, now() + (p_minutes || ' minutes')::interval);

  return true;
end;
$$;

-- Confirmar venta cuando Wompi aprueba — RB-CHK-04
create or replace function confirm_stock_sale(
  p_variant_id uuid,
  p_session_id text,
  p_quantity   integer,
  p_order_id   text
) returns void language plpgsql as $$
begin
  -- Marcar reserva como convertida
  update stock_reservations
  set converted = true
  where variant_id = p_variant_id
    and session_id = p_session_id
    and not converted;

  -- Descontar stock definitivamente
  update product_variants
  set stock    = stock - p_quantity,
      reserved = greatest(0, reserved - p_quantity)
  where id = p_variant_id;

  -- Registrar movimiento
  insert into stock_movements(variant_id, type, quantity, reference, notes)
  values (p_variant_id, 'sale', -p_quantity, p_order_id, 'Venta confirmada por Wompi');
end;
$$;

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

alter table customers              enable row level security;
alter table customer_addresses     enable row level security;
alter table wishlists              enable row level security;
alter table orders                 enable row level security;
alter table order_items            enable row level security;

-- Clientes solo ven sus propios datos
create policy "customers_own_data" on customers
  for all using (auth.uid() = auth_user_id);

create policy "addresses_own_data" on customer_addresses
  for all using (
    customer_id in (select id from customers where auth_user_id = auth.uid())
  );

create policy "wishlists_own_data" on wishlists
  for all using (
    customer_id in (select id from customers where auth_user_id = auth.uid())
  );

create policy "orders_own_data" on orders
  for select using (
    customer_id in (select id from customers where auth_user_id = auth.uid())
  );

create policy "order_items_own_data" on order_items
  for select using (
    order_id in (
      select id from orders where customer_id in (
        select id from customers where auth_user_id = auth.uid()
      )
    )
  );

-- Tablas de catálogo son públicas de lectura
alter table products           enable row level security;
alter table product_variants   enable row level security;
alter table categories         enable row level security;
alter table collections        enable row level security;
alter table occasions          enable row level security;

create policy "products_public_read" on products
  for select using (status = 'active');

create policy "variants_public_read" on product_variants
  for select using (true);

create policy "categories_public_read" on categories
  for select using (true);

create policy "collections_public_read" on collections
  for select using (is_active = true);

create policy "occasions_public_read" on occasions
  for select using (true);

-- ============================================================
-- DATOS INICIALES
-- ============================================================

insert into variant_attributes (id, name) values
  (gen_random_uuid(), 'talla'),
  (gen_random_uuid(), 'color');

insert into occasions (name, slug, sort_order) values
  ('Playa', 'playa', 1),
  ('Noche', 'noche', 2),
  ('Casual', 'casual', 3),
  ('Trabajo', 'trabajo', 4);
