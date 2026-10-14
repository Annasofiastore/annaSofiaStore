-- Ajuste manual de inventario desde el panel admin
--
-- Motivo: la tienda también vende por WhatsApp, canal que no pasa por el checkout
-- y por tanto no descuenta stock. Sin esta función el único modo de corregir el
-- inventario es reenviar el producto completo por PUT /api/admin/products/[id],
-- que sobrescribe todas las variantes de golpe.
--
-- Se fija el stock a un VALOR ABSOLUTO (no un delta) a propósito: desde el celular
-- un POST se puede reenviar por doble toque, y repetir la misma llamada debe dejar
-- el mismo resultado.

create or replace function adjust_variant_stock(
  p_variant_id uuid,
  p_new_stock  integer,
  p_reason     text,
  p_note       text default null,
  p_changed_by uuid default null
) returns jsonb language plpgsql as $$
declare
  v_stock    integer;
  v_reserved integer;
  v_delta    integer;
  v_type     stock_movement_type;
begin
  if p_new_stock is null or p_new_stock < 0 then
    raise exception 'El stock no puede ser negativo';
  end if;

  -- Mapear el motivo de negocio al enum de movimientos.
  -- La lista blanca vive aquí además de en la API: la RPC es la última línea.
  v_type := case p_reason
    when 'venta_whatsapp' then 'sale'
    when 'devolucion'     then 'return'
    when 'entrada'        then 'purchase'
    when 'conteo'         then 'adjustment'
    when 'dano'           then 'adjustment'
    else null
  end;

  if v_type is null then
    raise exception 'Motivo no válido: %', p_reason;
  end if;

  -- Bloqueo de fila, igual que reserve_stock, para que un ajuste manual y una
  -- reserva de carrito concurrentes no se pisen.
  select stock, reserved into v_stock, v_reserved
  from product_variants
  where id = p_variant_id
  for update;

  if not found then
    raise exception 'La variante no existe';
  end if;

  -- Todo el checkout asume stock - reserved >= 0. Si hay carritos abiertos con
  -- esa variante no se puede bajar por debajo de lo ya reservado.
  if p_new_stock < v_reserved then
    raise exception 'Hay % unidades reservadas en carritos; no puedes bajar el stock por debajo de %',
      v_reserved, v_reserved;
  end if;

  v_delta := p_new_stock - v_stock;

  -- Sin cambio: no se escribe nada ni se registra movimiento.
  if v_delta = 0 then
    return jsonb_build_object(
      'stock', v_stock,
      'reserved', v_reserved,
      'available', v_stock - v_reserved,
      'delta', 0
    );
  end if;

  -- El trigger trg_sync_product_sold_out recalcula products.is_sold_out solo.
  update product_variants
  set stock = p_new_stock
  where id = p_variant_id;

  insert into stock_movements(variant_id, type, quantity, reference, notes, changed_by)
  values (
    p_variant_id,
    v_type,
    v_delta,                      -- positivo = entrada, negativo = salida
    'manual:' || p_reason,
    p_note,
    p_changed_by
  );

  return jsonb_build_object(
    'stock', p_new_stock,
    'reserved', v_reserved,
    'available', p_new_stock - v_reserved,
    'delta', v_delta
  );
end;
$$;

-- Solo el service role (usado por /api/admin/inventory/adjust, que valida el rol
-- de admin antes de llamar) debe poder ejecutarla.
revoke all on function adjust_variant_stock(uuid, integer, text, text, uuid) from public, anon, authenticated;
grant execute on function adjust_variant_stock(uuid, integer, text, text, uuid) to service_role;
