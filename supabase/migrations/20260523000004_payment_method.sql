-- Método de pago en pedidos (wompi | contraentrega)
alter table orders
  add column if not exists payment_method text not null default 'wompi';

create index if not exists idx_orders_contraentrega
  on orders (payment_method) where payment_method = 'contraentrega';
