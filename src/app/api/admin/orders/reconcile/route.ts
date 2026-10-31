import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { checkWompiOrder } from "@/lib/payments/wompi-reconcile";

// Ventana de revisión y tope por ejecución: los pedidos se revisan a diario,
// así que 48 h cubren el día de trabajo y el cruce de medianoche.
const WINDOW_HOURS = 48;
const MAX_ORDERS = 20;
const CONCURRENCY = 4;

// POST — revisa contra Wompi los pedidos pendientes o cancelados de las últimas 48 h
// y marca como pagados los que Wompi tiene aprobados.
export async function POST() {
  const auth = await createClient();
  const { data: { user } } = await auth.auth.getUser();
  if (!user || user.app_metadata?.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const db = createServiceClient();
  const since = new Date(Date.now() - WINDOW_HOURS * 60 * 60 * 1000).toISOString();

  const { data: orders, error } = await db
    .from("orders")
    .select("*, items:order_items(*)")
    .eq("payment_method", "wompi")
    .in("status", ["pending_payment", "cancelled"])
    .is("paid_at", null)
    .not("wompi_reference", "is", null)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(MAX_ORDERS);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const recovered: string[] = [];
  const pending: string[] = [];
  let unpaid = 0;
  let unknown = 0;

  const list = orders ?? [];
  for (let i = 0; i < list.length; i += CONCURRENCY) {
    const batch = list.slice(i, i + CONCURRENCY);
    const results = await Promise.all(batch.map((order) => checkWompiOrder(db, order)));
    results.forEach((result, j) => {
      const number = batch[j].order_number;
      if (result === "recovered") recovered.push(number);
      else if (result === "pending") pending.push(number);
      else if (result === "unpaid") unpaid++;
      else if (result === "unknown") unknown++;
    });
  }

  return NextResponse.json({
    ok: true,
    checked: list.length,
    recovered,
    pending,
    unpaid,
    unknown,
    window_hours: WINDOW_HOURS,
  });
}
