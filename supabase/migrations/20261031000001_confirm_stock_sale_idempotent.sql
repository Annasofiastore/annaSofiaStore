-- confirm_stock_sale repetible: una venta se descuenta una sola vez por pedido y variante.
--
-- Un pago de Wompi puede confirmarse por varios caminos casi a la vez (webhook, redirect de la clienta,
-- verificación del admin, cron). Todos llaman a esta función ANTES de marcar el pedido como pagado, y la
-- versión original descontaba stock en cada llamada: si dos caminos coincidían, el stock se descontaba
-- dos veces. Ahora la función se salta la venta si ya hay un movimiento 'sale' para ese pedido y variante.
--
-- El `for update` sobre la variante hace que dos llamadas simultáneas se pongan en fila: la segunda espera,
-- ve el movimiento que dejó la primera y no hace nada.

create or replace function confirm_stock_sale(
  p_variant_id uuid,
  p_session_id text,
  p_quantity   integer,
  p_order_id   text
) returns void language plpgsql as $$
begin
  -- Serializar las ventas de esta variante
  perform 1 from product_variants where id = p_variant_id for update;

  -- Ya descontada para este pedido: no repetir
  if p_order_id is not null and exists (
    select 1 from stock_movements
    where variant_id = p_variant_id
      and type = 'sale'
      and reference = p_order_id
  ) then
    return;
  end if;

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
