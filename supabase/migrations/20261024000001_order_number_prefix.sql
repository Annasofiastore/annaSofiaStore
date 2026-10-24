-- Prefijo de los números de pedido: AS-WEB001, AS-WEB002, ...
-- Mantiene la secuencia existente (order_number_seq); solo cambia el formato.
create or replace function next_order_number()
returns text language sql as $$
  select 'AS-WEB' || lpad(nextval('order_number_seq')::text, 3, '0')
$$;
