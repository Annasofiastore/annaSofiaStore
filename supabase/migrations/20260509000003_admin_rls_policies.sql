-- ============================================================
-- Admin RLS policies — Phase 1 MVP
-- ============================================================
-- Security model: any authenticated user can manage catalog data.
-- The admin layout (/admin/layout.tsx) requires authentication.
-- Proper role-based access (DP-11) is deferred to Phase 2.
-- Service role (used by all API routes) bypasses RLS natively.
-- These policies cover browser-client admin pages (collections,
-- categories, occasions) that call Supabase directly.
-- ============================================================

-- products: authenticated users can read ALL (not just active) and write
create policy "products_admin_all" on products
  for all
  to authenticated
  using (true)
  with check (true);

-- product_variants: authenticated users full access
create policy "variants_admin_all" on product_variants
  for all
  to authenticated
  using (true)
  with check (true);

-- categories: authenticated users full access
create policy "categories_admin_all" on categories
  for all
  to authenticated
  using (true)
  with check (true);

-- collections: authenticated users full access
create policy "collections_admin_all" on collections
  for all
  to authenticated
  using (true)
  with check (true);

-- occasions: authenticated users full access
create policy "occasions_admin_all" on occasions
  for all
  to authenticated
  using (true)
  with check (true);

-- promotions: enable RLS and add policies
alter table promotions enable row level security;

create policy "promotions_public_read" on promotions
  for select
  using (
    is_active = true
    and starts_at <= now()
    and ends_at >= now()
  );

create policy "promotions_admin_all" on promotions
  for all
  to authenticated
  using (true)
  with check (true);

-- orders: allow authenticated users to read/update all orders (admin)
-- Combines with orders_own_data via OR — admins and customers both need access
create policy "orders_admin_all" on orders
  for all
  to authenticated
  using (true)
  with check (true);

-- order_items: allow authenticated users to read all
create policy "order_items_admin_read" on order_items
  for select
  to authenticated
  using (true);

-- customers: allow authenticated users to read all (for admin panel)
-- The existing customers_own_data policy lets customers see their own data;
-- this adds admin read-all on top (policies combine with OR).
create policy "customers_admin_read" on customers
  for select
  to authenticated
  using (true);

-- Allow service role to INSERT customers (for guest checkout)
-- Note: service_role bypasses RLS already, but explicit for clarity
create policy "customers_service_insert" on customers
  for insert
  with check (true);

-- order_status_log: enable RLS, allow authenticated users full access
alter table order_status_log enable row level security;

create policy "order_status_log_admin_all" on order_status_log
  for all
  to authenticated
  using (true)
  with check (true);

-- stock_movements: enable RLS, allow authenticated users full access
alter table stock_movements enable row level security;

create policy "stock_movements_admin_all" on stock_movements
  for all
  to authenticated
  using (true)
  with check (true);

-- stock_reservations: enable RLS, allow service role operations
alter table stock_reservations enable row level security;

create policy "stock_reservations_admin_all" on stock_reservations
  for all
  to authenticated
  using (true)
  with check (true);

-- product junction tables: not RLS protected, no policies needed
-- product_categories, product_collections, product_occasions are open tables
