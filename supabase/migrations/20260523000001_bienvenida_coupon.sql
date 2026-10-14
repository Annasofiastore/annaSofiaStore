-- Cupón de bienvenida: 10% de descuento en el primer pedido
insert into promotions (
  code, name, discount_type, discount_value,
  scope, max_uses, max_uses_per_customer,
  starts_at, ends_at, is_active, is_cumulative
) values (
  'BIENVENIDA10',
  'Descuento de bienvenida — 10% primer pedido',
  'percentage',
  10.00,
  'global',
  null,
  1,
  now(),
  '2030-12-31 23:59:59+00',
  true,
  false
) on conflict (code) do nothing;
