-- Secuencia consecutiva para números de pedido
create sequence if not exists order_number_seq start 1;

-- Función que retorna el siguiente número formateado: MB-WEB001, MB-WEB002, ...
create or replace function next_order_number()
returns text language sql as $$
  select 'MB-WEB' || lpad(nextval('order_number_seq')::text, 3, '0')
$$;
