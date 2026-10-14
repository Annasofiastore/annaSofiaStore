import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { brand } from "@/lib/config/brand";

const STATUS_LABEL: Record<string, string> = {
  pending_payment: "Pendiente de pago",
  paid: "Pagado",
  preparing: "En preparación",
  shipped: "Enviado",
  delivered: "Entregado",
  cancelled: "Cancelado",
};

const PAYMENT_LABEL: Record<string, string> = {
  wompi: "En línea (Wompi)",
  contraentrega: "Contraentrega",
};

export async function GET(req: NextRequest) {
  // Verificar autenticación y rol de admin
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.app_metadata?.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const status = searchParams.get("status");

  if (!from || !to) {
    return NextResponse.json({ error: "Faltan los parámetros 'from' y 'to'" }, { status: 400 });
  }

  const fromDate = new Date(`${from}T00:00:00`).toISOString();
  const toDate = new Date(`${to}T23:59:59.999`).toISOString();

  const service = await createServiceClient();

  let query = service
    .from("orders")
    .select(`
      order_number, shipping_name, shipping_email, shipping_phone,
      shipping_address, shipping_city, shipping_department,
      payment_method, status, subtotal, discount_amount, shipping_cost, total,
      created_at, paid_at, shipped_at, delivered_at, tracking_number, courier, notes,
      items:order_items(product_name, variant_attrs, quantity)
    `)
    .gte("created_at", fromDate)
    .lte("created_at", toDate)
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);

  const { data: orders, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const headers = [
    "Pedido",
    "Clienta",
    "Email",
    "Teléfono",
    "Dirección",
    "Ciudad",
    "Departamento",
    "Productos",
    "Método de pago",
    "Estado",
    "Subtotal",
    "Descuento",
    "Envío",
    "Total",
    "Fecha de creación",
    "Fecha de pago",
    "Fecha de envío",
    "Fecha de entrega",
    "Transportadora",
    "Número de guía",
    "Notas",
  ];

  const rows = (orders ?? []).map((o: any) => [
    o.order_number,
    o.shipping_name,
    o.shipping_email,
    o.shipping_phone,
    o.shipping_address,
    o.shipping_city,
    o.shipping_department,
    (o.items ?? [])
      .map((i: any) => {
        const attrs = Object.values(i.variant_attrs ?? {}).join(" / ");
        return `${i.product_name}${attrs ? ` (${attrs})` : ""} x${i.quantity}`;
      })
      .join("; "),
    PAYMENT_LABEL[o.payment_method] ?? o.payment_method,
    STATUS_LABEL[o.status] ?? o.status,
    Number(o.subtotal),
    Number(o.discount_amount),
    Number(o.shipping_cost),
    Number(o.total),
    o.created_at ? new Date(o.created_at).toLocaleString("es-CO") : "",
    o.paid_at ? new Date(o.paid_at).toLocaleString("es-CO") : "",
    o.shipped_at ? new Date(o.shipped_at).toLocaleString("es-CO") : "",
    o.delivered_at ? new Date(o.delivered_at).toLocaleString("es-CO") : "",
    o.courier ?? "",
    o.tracking_number ?? "",
    o.notes ?? "",
  ]);

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  ws["!cols"] = [
    { wch: 14 }, // Pedido
    { wch: 22 }, // Clienta
    { wch: 26 }, // Email
    { wch: 14 }, // Teléfono
    { wch: 30 }, // Dirección
    { wch: 16 }, // Ciudad
    { wch: 16 }, // Departamento
    { wch: 40 }, // Productos
    { wch: 16 }, // Método de pago
    { wch: 16 }, // Estado
    { wch: 12 }, // Subtotal
    { wch: 12 }, // Descuento
    { wch: 12 }, // Envío
    { wch: 12 }, // Total
    { wch: 18 }, // Fecha creación
    { wch: 18 }, // Fecha pago
    { wch: 18 }, // Fecha envío
    { wch: 18 }, // Fecha entrega
    { wch: 16 }, // Transportadora
    { wch: 16 }, // Guía
    { wch: 30 }, // Notas
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Pedidos");

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buf, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="pedidos_${brand.slug}_${from}_a_${to}.xlsx"`,
    },
  });
}
