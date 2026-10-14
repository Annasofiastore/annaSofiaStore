-- Documento de identidad en pedidos
alter table orders
  add column if not exists customer_id_type text,
  add column if not exists customer_id_number text;

-- Documento de identidad en clientes
alter table customers
  add column if not exists id_type text,
  add column if not exists id_number text;

create index if not exists idx_customers_id_number
  on customers (id_number) where id_number is not null;
