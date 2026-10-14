-- Tabla de configuración de contenido del sitio (clave-valor)
create table if not exists site_settings (
  key        text primary key,
  value      text,
  updated_at timestamptz default now()
);

-- Lectura pública (el storefront la necesita para leer la imagen de Nosotras)
alter table site_settings enable row level security;
create policy "site_settings_public_read"
  on site_settings for select using (true);

-- Valor por defecto: imagen actual de la sección Nosotras
insert into site_settings (key, value)
values ('nosotras_historia_image', '/nosotras-historia.jpg')
on conflict (key) do nothing;
