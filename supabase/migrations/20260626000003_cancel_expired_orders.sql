-- Cancela automáticamente pedidos en pending_payment con más de 30 minutos — RB-PED-02
-- El stock ya fue liberado por release_expired_reservations() (que corre cada minuto)
create or replace function cancel_expired_orders()
returns integer language plpgsql as $$
declare
  v_order record;
  v_count integer := 0;
begin
  for v_order in
    select id from orders
    where status = 'pending_payment'
      and payment_method = 'wompi'
      and created_at < now() - interval '30 minutes'
    for update skip locked
  loop
    update orders
    set status = 'cancelled', updated_at = now()
    where id = v_order.id;

    insert into order_status_log(order_id, from_status, to_status, notes)
    values (
      v_order.id,
      'pending_payment',
      'cancelled',
      'Cancelado automáticamente: pago no completado en 30 minutos'
    );

    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;
