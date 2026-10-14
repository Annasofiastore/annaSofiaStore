-- Almacenar el sessionId del carrito en el pedido
-- para que el webhook pueda marcar la reserva como convertida correctamente
alter table orders add column if not exists cart_session_id text;
