-- ============================================================
-- Admin role — función is_admin() + RLS restringido a admins
-- ============================================================

-- Función helper: lee app_metadata.role del JWT actual
create or replace function is_admin()
returns boolean
language sql
security definer
stable
as $$
  select coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin',
    false
  )
$$;

-- ============================================================
-- Reemplazar políticas de escritura demasiado amplias
-- (authenticated = cualquier clienta registrada podía escribir)
-- por políticas restringidas a is_admin()
-- ============================================================

-- PRODUCTS
drop policy if exists "products_admin_all" on products;
create policy "products_admin_write" on products
  for all to authenticated
  using (is_admin())
  with check (is_admin());

-- PRODUCT_VARIANTS
drop policy if exists "variants_admin_all" on product_variants;
create policy "variants_admin_write" on product_variants
  for all to authenticated
  using (is_admin())
  with check (is_admin());

-- CATEGORIES
drop policy if exists "categories_admin_all" on categories;
create policy "categories_admin_write" on categories
  for all to authenticated
  using (is_admin())
  with check (is_admin());

-- COLLECTIONS
drop policy if exists "collections_admin_all" on collections;
create policy "collections_admin_write" on collections
  for all to authenticated
  using (is_admin())
  with check (is_admin());

-- OCCASIONS
drop policy if exists "occasions_admin_all" on occasions;
create policy "occasions_admin_write" on occasions
  for all to authenticated
  using (is_admin())
  with check (is_admin());

-- PROMOTIONS
drop policy if exists "promotions_admin_all" on promotions;
create policy "promotions_admin_write" on promotions
  for all to authenticated
  using (is_admin())
  with check (is_admin());

-- ORDERS
drop policy if exists "orders_admin_all" on orders;
create policy "orders_admin_write" on orders
  for all to authenticated
  using (is_admin())
  with check (is_admin());

-- ORDER_ITEMS
drop policy if exists "order_items_admin_read" on order_items;
create policy "order_items_admin_read" on order_items
  for select to authenticated
  using (is_admin());

-- CUSTOMERS
drop policy if exists "customers_admin_read" on customers;
drop policy if exists "customers_service_insert" on customers;
create policy "customers_admin_read" on customers
  for select to authenticated
  using (
    auth.uid() = auth_user_id   -- clienta ve sus propios datos
    or is_admin()                -- admin ve todos
  );

-- ORDER_STATUS_LOG
drop policy if exists "order_status_log_admin_all" on order_status_log;
create policy "order_status_log_admin_write" on order_status_log
  for all to authenticated
  using (is_admin())
  with check (is_admin());

-- STOCK_MOVEMENTS
drop policy if exists "stock_movements_admin_all" on stock_movements;
create policy "stock_movements_admin_write" on stock_movements
  for all to authenticated
  using (is_admin())
  with check (is_admin());

-- STOCK_RESERVATIONS
drop policy if exists "stock_reservations_admin_all" on stock_reservations;
create policy "stock_reservations_admin_write" on stock_reservations
  for all to authenticated
  using (is_admin())
  with check (is_admin());
