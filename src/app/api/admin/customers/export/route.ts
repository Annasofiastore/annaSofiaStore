import { isAdminUser } from "@/lib/auth/admin";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { brand } from "@/lib/config/brand";

export async function GET() {
  const supabase = await createClient();

  // Verificar que el usuario es admin
  const { data: { user } } = await supabase.auth.getUser();
  if (!isAdminUser(user)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { data: customers, error } = await supabase
    .from("customers")
    .select(`
      id,
      email,
      full_name,
      phone,
      marketing_email,
      marketing_whatsapp,
      is_guest,
      created_at,
      orders (id, total, status)
    `)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Error al obtener clientes" }, { status: 500 });
  }

  const rows = (customers ?? []).map((c: any) => {
    const completedOrders = (c.orders ?? []).filter((o: any) =>
      ["paid", "preparing", "shipped", "delivered"].includes(o.status)
    );
    const totalSpent = completedOrders.reduce((s: number, o: any) => s + Number(o.total), 0);

    return {
      email: c.email,
      nombre: c.full_name,
      telefono: c.phone ?? "",
      tipo: c.is_guest ? "Invitada" : "Registrada",
      pedidos: completedOrders.length,
      total_gastado: totalSpent.toFixed(0),
      marketing_email: c.marketing_email ? "Sí" : "No",
      marketing_whatsapp: c.marketing_whatsapp ? "Sí" : "No",
      fecha_registro: new Date(c.created_at).toLocaleDateString("es-CO"),
    };
  });

  const headers = [
    "email",
    "nombre",
    "telefono",
    "tipo",
    "pedidos",
    "total_gastado",
    "marketing_email",
    "marketing_whatsapp",
    "fecha_registro",
  ];

  const csvRows = [
    headers.join(","),
    ...rows.map((r) =>
      headers.map((h) => `"${String((r as any)[h]).replace(/"/g, '""')}"`).join(",")
    ),
  ];

  const csv = csvRows.join("\r\n");
  const filename = `clientes-${brand.slug}-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
