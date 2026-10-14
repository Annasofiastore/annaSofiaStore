-- Permite marcar una colección como destacada en el inicio
alter table collections add column if not exists featured_on_home boolean default false;

-- Solo una colección puede estar destacada a la vez
create unique index if not exists collections_one_featured_home
  on collections (featured_on_home)
  where featured_on_home = true;
