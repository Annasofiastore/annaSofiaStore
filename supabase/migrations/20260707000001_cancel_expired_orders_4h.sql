-- Aumentar timeout de cancelación automática de 30 minutos a 4 horas
-- Razón: PSE y otros métodos pueden tardar 20-35 min en autenticación bancaria.
-- Con processWompiRedirect la cancelación es recuperable, pero es mejor no cancelar prematuramente.
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
      and created_at < now() - interval '4 hours'
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
      'Cancelado automáticamente: pago no completado en 4 horas'
    );

    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;
