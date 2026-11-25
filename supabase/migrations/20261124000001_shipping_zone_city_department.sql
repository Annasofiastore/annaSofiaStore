-- Zonas de envío por departamento + municipio.
-- Antes solo se comparaba el nombre del municipio, así que dos departamentos con un municipio del mismo
-- nombre recibían la misma tarifa. Ahora cada ciudad asignada a una zona puede llevar su departamento.
-- Las filas existentes quedan con department = null: siguen valiendo para cualquier departamento
-- (comportamiento anterior) hasta que se les asigne uno desde el panel.
alter table shipping_zone_cities add column if not exists department text;

-- city_name era único por sí solo; ahora lo es la pareja (municipio, departamento)
alter table shipping_zone_cities drop constraint if exists shipping_zone_cities_city_name_key;
create unique index if not exists idx_shipping_zone_cities_city_dept
  on shipping_zone_cities (lower(city_name), lower(coalesce(department, '')));
