alter table products
  add column if not exists is_best_seller boolean not null default false;

create index if not exists idx_products_best_seller
  on products (is_best_seller) where is_best_seller = true;
