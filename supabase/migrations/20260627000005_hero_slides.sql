create table hero_slides (
  id          uuid primary key default gen_random_uuid(),
  image_url   text not null,
  alt_text    text,
  sort_order  integer not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz default now()
);

create index idx_hero_slides_order on hero_slides (sort_order) where is_active = true;

alter table hero_slides enable row level security;
create policy "hero_slides_public_read" on hero_slides for select using (true);
