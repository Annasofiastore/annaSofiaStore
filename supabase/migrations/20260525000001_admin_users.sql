-- ============================================================
-- Asignar rol admin a usuarios existentes
-- ============================================================
update auth.users
set raw_app_meta_data = raw_app_meta_data || '{"role": "admin"}'::jsonb
where email in (
  'mariaisabelb14@gmail.com',
  'mariaaram29@hotmail.com',
  'jcriverorev@gmail.com'
);

-- ============================================================
-- Trigger: asignar rol admin automáticamente al registrarse
-- (cubre el caso en que el usuario aún no tiene cuenta)
-- ============================================================
create or replace function assign_admin_role_on_signup()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.email in (
    'mariaisabelb14@gmail.com',
    'mariaaram29@hotmail.com',
    'jcriverorev@gmail.com'
  ) then
    new.raw_app_meta_data :=
      coalesce(new.raw_app_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_assign_admin on auth.users;
create trigger on_auth_user_created_assign_admin
  before insert on auth.users
  for each row
  execute function assign_admin_role_on_signup();
