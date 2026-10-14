import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { createServiceClient } from "@/lib/supabase/server";
import { sendOrderConfirmationEmail, sendNewOrderAdminEmail } from "@/lib/email/templates";
import { sendEmailsSafe } from "@/lib/email/resend";
import type { WompiWebhookEvent } from "@/types";

// Verificar firma del webhook — seguridad
// Wompi envía properties como "data.transaction.id" — rutas desde la RAÍZ del evento
function verifySignature(event: WompiWebhookEvent, secret: string): boolean {
  if (!secret) {
    console.error("[wompi_webhook] WOMPI_EVENTS_SECRET no está configurado");
    return false;
  }

  const { properties, checksum } = event.signature;

  const values = properties.map((prop) => {
    const parts = prop.split(".");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let value: any = event; // ← raíz del evento, no event.data
    for (const part of parts) {
      value = value?.[part];
    }
    return value ?? "";
  });

  const str = [...values, event.timestamp, secret].join("");
  const expected = createHash("sha256").update(str).digest("hex");

  if (expected !== checksum) {
    console.error("[wompi_webhook] Firma inválida", {
      properties,
      values,
      timestamp: event.timestamp,
      expected,
      received: checksum,
    });
  }

  return expected === checksum;
}

export async function POST(req: NextRequest) {
  let rawRef = "(sin referencia)";
  try {
    const body: WompiWebhookEvent = await req.json();
    const secret = process.env.WOMPI_EVENTS_SECRET!;

    // Logging para diagnóstico — quitar cuando el webhook sea estable
    console.log("[wompi_webhook] Evento recibido:", {
      event: body.event,
      reference: body.data?.transaction?.reference,
      status: body.data?.transaction?.status,
      timestamp: body.timestamp,
      hasSecret: !!secret,
    });

    rawRef = body.data?.transaction?.reference ?? "(sin referencia)";

    // Validar firma — RB-CHK-04
    if (!verifySignature(body, secret)) {
      console.error("[wompi_webhook] FIRMA INVÁLIDA para ref:", rawRef,
        "Verificar WOMPI_EVENTS_SECRET en Vercel → Project Settings → Environment Variables"
      );
      return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
    }

    const { event, data } = body;
    if (event !== "transaction.updated") {
      console.log("[wompi_webhook] Evento ignorado:", event);
      return NextResponse.json({ ok: true });
    }

    const tx = data.transaction;
    console.log("[wompi_webhook] Procesando transacción:", tx.id, "ref:", tx.reference, "estado:", tx.status);

    const supabase = createServiceClient();

    // Buscar pedido por referencia
    const { data: order } = await supabase
      .from("orders")
      .select(`*, cart_session_id, items:order_items(*)`)
      .eq("wompi_reference", tx.reference)
      .single();

    if (!order) {
      console.error("[wompi_webhook] Pedido no encontrado para ref:", tx.reference);
      return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
    }

    console.log("[wompi_webhook] Pedido encontrado:", order.order_number, "estado actual:", order.status);

    // Idempotencia: si ya está pagado, no hacer nada
    if (order.status === "paid" && tx.status === "APPROVED") {
      console.log("[wompi_webhook] Idempotencia: pedido ya pagado, nada que hacer");
      return NextResponse.json({ ok: true });
    }

    if (tx.status === "APPROVED") {
      // ── PAGO APROBADO ──────────────────────────────────────

      // 1. Confirmar stock de cada variante — RB-CHK-04 (idempotente)
      for (const item of order.items) {
        const { error: stockErr } = await supabase.rpc("confirm_stock_sale", {
          p_variant_id: item.variant_id,
          p_session_id: order.cart_session_id ?? order.wompi_reference,
          p_quantity: item.quantity,
          p_order_id: order.id,
        });
        if (stockErr) console.error("[wompi_webhook] confirm_stock_sale error:", stockErr);
      }

      // 2. Update atómico — solo si el pedido sigue siendo confirmable.
      // Si la página de confirmación ya lo marcó "paid", el update devuelve 0 filas y no enviamos emails duplicados.
      const { data: updateResult } = await supabase
        .from("orders")
        .update({
          status: "paid",
          wompi_transaction_id: tx.id,
          paid_at: new Date().toISOString(),
        })
        .eq("id", order.id)
        .in("status", ["pending_payment", "cancelled"])
        .select("id");

      if (!updateResult?.length) {
        console.log("[wompi_webhook] Pedido ya confirmado por otro proceso:", order.order_number, "— nada que hacer");
        return NextResponse.json({ ok: true });
      }

      // 3. Log de estado — RB-PED-04
      await supabase.from("order_status_log").insert({
        order_id: order.id,
        from_status: order.status,
        to_status: "paid",
        notes: `Pago confirmado por Wompi. Transacción: ${tx.id}`,
      });

      console.log("[wompi_webhook] Pedido actualizado a PAGADO:", order.order_number);

      // 4. Emails — RB-PED-03, RB-PED-05
      const { data: fullOrder } = await supabase
        .from("orders")
        .select("*, items:order_items(*)")
        .eq("id", order.id)
        .single();

      if (fullOrder) {
        await sendEmailsSafe(
          `webhook/APPROVED/${order.order_number}`,
          sendOrderConfirmationEmail(fullOrder),
          sendNewOrderAdminEmail(fullOrder),
        );
      }

    } else if (tx.status === "DECLINED" || tx.status === "VOIDED" || tx.status === "ERROR") {
      // ── PAGO RECHAZADO — solo registrar, NO cancelar el pedido ─────────
      // La clienta puede reintentar en el mismo checkout de Wompi (misma referencia,
      // nueva transacción). Si cancelamos aquí y el webhook APPROVED llega después,
      // hay una ventana donde el pedido queda cancelado aunque el pago fue exitoso.
      // El pg_cron cancel_expired_orders se encarga de limpiar pedidos realmente
      // abandonados después de 30 minutos sin confirmación de pago.
      console.log("[wompi_webhook] Transacción rechazada:", tx.id, "estado:", tx.status,
        "pedido:", order.order_number, "— no se cancela (la clienta puede reintentar).");
    } else {
      console.log("[wompi_webhook] Estado de transacción no manejado:", tx.status);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[wompi_webhook] Error inesperado (ref:", rawRef, "):", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
