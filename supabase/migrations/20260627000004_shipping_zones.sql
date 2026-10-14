-- Zonas de envío con precios configurables por el admin
create table shipping_zones (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique,       -- 'local', 'main_cities', 'municipalities'
  name        text not null,
  description text,
  price       numeric(12,2) not null default 0,
  sort_order  integer not null default 0,
  updated_at  timestamptz default now()
);

-- Ciudades asignadas a cada zona (zona 3 = fallback, no necesita entradas)
create table shipping_zone_cities (
  id        uuid primary key default gen_random_uuid(),
  zone_id   uuid not null references shipping_zones(id) on delete cascade,
  city_name text not null unique  -- nombre normalizado (original, búsqueda case-insensitive)
);

create index idx_shipping_zone_cities_zone on shipping_zone_cities(zone_id);
create index idx_shipping_zone_cities_name on shipping_zone_cities(lower(city_name));

-- Datos iniciales: 3 zonas
insert into shipping_zones (code, name, description, price, sort_order) values
  ('local',          'Cartagena y Turbaco',   'Entrega en Cartagena y Turbaco',                  10000, 1),
  ('main_cities',    'Ciudades principales',  'Bogotá, Medellín, Cali, Barranquilla y similares', 16000, 2),
  ('municipalities', 'Municipios',            'Otros municipios y pueblos de Colombia',            18000, 3);

-- Zona 1: Cartagena y Turbaco
insert into shipping_zone_cities (zone_id, city_name)
select id, unnest(array['Cartagena','Turbaco'])
from shipping_zones where code = 'local';

-- Zona 2: Ciudades principales de Colombia
insert into shipping_zone_cities (zone_id, city_name)
select id, unnest(array[
  'Bogotá D.C.','Medellín','Cali','Barranquilla','Bucaramanga',
  'Pereira','Manizales','Cúcuta','Ibagué','Neiva',
  'Santa Marta','Montería','Pasto','Armenia','Villavicencio',
  'Valledupar','Popayán','Sincelejo','Tunja','Florencia',
  'Yopal','Arauca','Riohacha','Quibdó','Mocoa',
  'Leticia','Mitú','Puerto Carreño','Inírida','San José del Guaviare',
  'Bello','Itagüí','Envigado','Soledad','Malambo',
  'Palmira','Buenaventura','Buga','Cartago','Tuluá',
  'Soacha','Facatativá','Girardot','Zipaquirá','Chía',
  'Floridablanca','Girón','Piedecuesta','Barrancabermeja',
  'Magangué','Lorica','Sahagún','Cereté',
  'Ocaña','Pamplona',
  'Honda','Espinal','Chaparral',
  'Pitalito','Garzón','La Plata',
  'Sogamoso','Duitama','Chiquinquirá',
  'Dosquebradas','Santa Rosa de Cabal',
  'La Dorada','Aguadas',
  'Baranoa','Sabanalarga',
  'Ciénaga','Fundación',
  'Aguachica','Codazzi',
  'Maicao','Uribia',
  'Mompox','El Carmen de Bolívar','María La Baja'
])
from shipping_zones where code = 'main_cities';

-- RLS: zonas de envío son públicas de lectura
alter table shipping_zones enable row level security;
alter table shipping_zone_cities enable row level security;

create policy "shipping_zones_public_read" on shipping_zones for select using (true);
create policy "shipping_zone_cities_public_read" on shipping_zone_cities for select using (true);
