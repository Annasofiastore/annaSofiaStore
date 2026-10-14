-- Función para liberar reservas de una variante específica por sesión
-- Usada cuando: cliente quita item del carrito, pago rechazado
CREATE OR REPLACE FUNCTION release_reservations_by_session(
  p_variant_id uuid,
  p_session_id text
) RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  v_quantity integer;
BEGIN
  SELECT COALESCE(SUM(quantity), 0) INTO v_quantity
  FROM stock_reservations
  WHERE variant_id = p_variant_id
    AND session_id = p_session_id
    AND NOT converted;

  IF v_quantity > 0 THEN
    UPDATE product_variants
    SET reserved = GREATEST(0, reserved - v_quantity)
    WHERE id = p_variant_id;

    INSERT INTO stock_movements (variant_id, type, quantity, notes)
    VALUES (
      p_variant_id,
      'reservation_released',
      v_quantity,
      'Released by session: ' || p_session_id
    );

    DELETE FROM stock_reservations
    WHERE variant_id = p_variant_id
      AND session_id = p_session_id
      AND NOT converted;
  END IF;
END;
$$;

-- Función para liberar N unidades de una reserva (cuando cliente reduce cantidad en carrito)
CREATE OR REPLACE FUNCTION release_partial_reservation(
  p_variant_id uuid,
  p_session_id text,
  p_quantity   integer
) RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  v_reservation_id uuid;
  v_current_qty    integer;
BEGIN
  SELECT id, quantity INTO v_reservation_id, v_current_qty
  FROM stock_reservations
  WHERE variant_id = p_variant_id
    AND session_id = p_session_id
    AND NOT converted
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_reservation_id IS NULL THEN RETURN; END IF;

  IF v_current_qty <= p_quantity THEN
    -- Liberar toda la reserva si la diferencia cubre todo
    UPDATE product_variants
    SET reserved = GREATEST(0, reserved - v_current_qty)
    WHERE id = p_variant_id;

    DELETE FROM stock_reservations WHERE id = v_reservation_id;
  ELSE
    -- Reducir la cantidad reservada
    UPDATE product_variants
    SET reserved = GREATEST(0, reserved - p_quantity)
    WHERE id = p_variant_id;

    UPDATE stock_reservations
    SET quantity = quantity - p_quantity
    WHERE id = v_reservation_id;
  END IF;

  INSERT INTO stock_movements (variant_id, type, quantity, notes)
  VALUES (
    p_variant_id,
    'reservation_released',
    p_quantity,
    'Partial release by session: ' || p_session_id
  );
END;
$$;

-- pg_cron: liberar reservas expiradas cada minuto (requiere extensión habilitada en Supabase)
-- Habilitar desde: Supabase Dashboard → Database → Extensions → pg_cron → Enable
-- Luego ejecutar manualmente en SQL editor:
--   SELECT cron.schedule('release-expired-reservations', '* * * * *', 'SELECT release_expired_reservations()');
