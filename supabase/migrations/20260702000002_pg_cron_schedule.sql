-- Programación automática con pg_cron en Supabase
-- Requiere extensión habilitada: Supabase Dashboard → Database → Extensions → pg_cron → Enable
--
-- INSTRUCCIONES:
-- 1. Habilitar pg_cron en Supabase Dashboard → Database → Extensions
-- 2. Ejecutar este script en el SQL Editor
-- 3. Verificar con: SELECT * FROM cron.job;

CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Eliminar trabajos previos si existen (evitar duplicados)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'release-expired-reservations') THEN
    PERFORM cron.unschedule('release-expired-reservations');
  END IF;
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'cancel-expired-orders') THEN
    PERFORM cron.unschedule('cancel-expired-orders');
  END IF;
END
$$;

-- Liberar reservas de stock expiradas cada minuto — RB-CHK-01, RB-PED-02
SELECT cron.schedule(
  'release-expired-reservations',
  '* * * * *',
  'SELECT release_expired_reservations()'
);

-- Cancelar pedidos sin pago confirmado pasados 30 minutos — RB-PED-02
SELECT cron.schedule(
  'cancel-expired-orders',
  '*/5 * * * *',
  'SELECT cancel_expired_orders()'
);
