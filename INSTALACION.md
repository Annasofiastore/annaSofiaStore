# Instalación para una tienda nueva

Checklist de puesta en marcha. Tiempo estimado: **4 a 6 horas**, sin contar la
carga del catálogo (que depende de cuántos productos tenga la tienda).

Las cuentas de Supabase, Vercel, Resend y Wompi deben quedar **a nombre de la
tienda y con su medio de pago**. Tú configuras; la tienda es la titular.

---

## 1 · Identidad de la marca

Editar **`src/lib/config/brand.ts`**. Es el único archivo con los datos de la
tienda: nombre, frase de marca, ciudad, dominio, correo, WhatsApp, redes,
razón social y NIT.

Verificar que `legal.businessName` y `legal.nit` sean los de la tienda. Esos
datos aparecen en los términos y en la política de privacidad, y son
obligatorios bajo la Ley 1581 de 2012.

## 2 · Paleta y tipografía

- `src/app/globals.css` — las variables de color están al inicio del archivo.
- `src/app/layout.tsx` — las dos fuentes de Google (display y sans).

Las páginas legales tienen su propia paleta embebida en la constante `CSS` de
cada archivo; ajustarla si se cambian los colores principales.

## 3 · Textos legales

Revisar y adaptar con la tienda:

- `src/app/terminos/page.tsx`
- `src/app/privacidad/page.tsx`
- `src/app/devoluciones/page.tsx`

La estructura sigue la normativa colombiana (Ley 1480 de 2011 y Ley 1581 de
2012), pero los plazos de devolución, las zonas de envío y los canales de
atención cambian por tienda. **Que la tienda los apruebe por escrito.**

## 4 · Contenido propio

- `src/app/(storefront)/nosotras/page.tsx` — historia, valores y equipo.
  El arreglo `TEAM` viene con un registro de ejemplo; vaciarlo oculta la sección.
- `src/components/storefront/MarqueeStrip.tsx` — frases de la cinta del home.

## 5 · Imágenes

Ver `public/LEEME.txt`. Hacen falta el favicon, el icono de iOS, la foto de
"Nosotras" y la guía de tallas. Los productos y los banners del home se cargan
después desde el panel.

## 6 · Base de datos

1. Crear el proyecto en Supabase (región `us-east-1`).
2. Aplicar las migraciones en orden:
   `supabase db push` — o pegar los archivos de `supabase/migrations/` en el
   editor SQL, en orden alfabético.
3. Crear el bucket de Storage para imágenes de producto.
4. Cargar las plantillas de correo de `supabase/email-templates/` en
   Authentication → Email Templates.

## 7 · Variables de entorno

Copiar `.env.example` a `.env.local` y llenarlo. Las mismas variables van en
Vercel (Production y Preview).

`ADMIN_EMAILS` define quién entra a `/admin`: los correos de la dueña y el tuyo
mientras dure el soporte.

## 8 · Pagos

1. La tienda abre su cuenta de Wompi y completa la verificación.
2. Copiar las cuatro llaves a las variables de entorno.
3. Registrar el webhook en Wompi apuntando a
   `https://<dominio>/api/webhooks/wompi`.
4. Probar en `NEXT_PUBLIC_WOMPI_ENV=test` con el flujo completo: compra,
   confirmación, correo y descuento de inventario.
5. Pasar a `production` solo después de una transacción real de prueba.

## 9 · Correos

1. Verificar el dominio de la tienda en Resend (registros DNS).
2. `EMAIL_FROM` debe usar ese dominio verificado. Sin esto los correos no
   llegan a las clientas.

## 10 · Despliegue

1. Conectar el repositorio a Vercel.
2. Configurar el dominio.
3. Confirmar que el cron de `/api/cron/release-reservations` quedó activo —
   es el que libera el inventario reservado por carritos abandonados.

## 11 · Antes de entregar

- [ ] Compra de prueba completa en producción, con tarjeta real y reembolso
- [ ] Correos de confirmación llegando a una bandeja externa (no Gmail propio)
- [ ] Inventario descontando y reponiendo correctamente
- [ ] Zonas y costos de envío cargados
- [ ] Páginas legales aprobadas por la tienda
- [ ] Capacitación a la dueña: productos, pedidos, inventario y descuentos
- [ ] Credenciales entregadas y traspasadas a nombre de la tienda
- [ ] Acordado por escrito qué cubre el soporte y qué se cobra aparte
