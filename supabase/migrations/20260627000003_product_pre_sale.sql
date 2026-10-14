alter table products
  add column if not exists is_pre_sale boolean not null default false;

create index if not exists idx_products_pre_sale
  on products (is_pre_sale) where is_pre_sale = true;
