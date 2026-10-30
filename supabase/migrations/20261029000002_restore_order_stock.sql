-- Devuelve al inventario las unidades de un pedido cancelado.
--
-- Al confirmarse un pedido (pago de Wompi o pedido contraentrega) el stock se descuenta de forma
-- definitiva (confirm_stock_sale). Si el pedido se cancela antes de enviarse, esas unidades deben
-- volver a estar disponibles. Es idempotente: si ya se devolvieron, no hace nada.

create or replace function restore_order_stock(p_order_id uuid)
returns void
language plpgsql
as $$
declare
  v_item record;
begin
  if exists (
    select 1 from stock_movements
    where reference = p_order_id::text and type = 'return'
  ) then
    return;
  end if;

  for v_item in
    select variant_id, quantity from order_items where order_id = p_order_id
  loop
    update product_variants
    set stock = stock + v_item.quantity
    where id = v_item.variant_id;

    insert into stock_movements (variant_id, type, quantity, reference, notes)
    values (v_item.variant_id, 'return', v_item.quantity, p_order_id::text, 'Pedido cancelado: stock devuelto al inventario');
  end loop;
end;
$$;
