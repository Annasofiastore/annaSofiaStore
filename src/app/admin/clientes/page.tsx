import { createServiceClient } from "@/lib/supabase/server";
import { formatDateShort } from "@/lib/utils/format";

export default async function AdminClientesPage() {
  const supabase = createServiceClient();

  const { data: customers } = await supabase
    .from("customers")
    .select("id, full_name, email, phone, is_guest, marketing_email, created_at")
    .order("created_at", { ascending: false })
    .limit(300);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1
            className="text-3xl text-[#221A33]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Clientes
          </h1>
          <p className="text-sm text-[#766A63] mt-1">
            {customers?.length ?? 0} registradas (incluyendo invitadas)
          </p>
        </div>
        <a
          href="/api/admin/customers/export"
          className="text-[11px] tracking-[0.15em] uppercase border border-[#E8DED4] text-[#766A63] px-4 py-2 hover:border-[#766A63] hover:text-[#221A33] transition-colors font-[500]"
        >
          Exportar CSV
        </a>
      </div>

      <div className="bg-white border border-[#E8DED4] overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#E8DED4]">
              {["Nombre", "Email", "Teléfono", "Tipo", "Marketing", "Fecha"].map((h) => (
                <th key={h} className="text-left text-[9px] tracking-[0.2em] uppercase text-[#766A63] font-[600] px-4 py-3">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(customers ?? []).map((c) => (
              <tr key={c.id} className="border-b border-[#F7F2EC] hover:bg-[#F7F2EC]/50 transition-colors">
                <td className="px-4 py-3 font-[400] text-[#221A33]">{c.full_name}</td>
                <td className="px-4 py-3 text-[#766A63]">{c.email}</td>
                <td className="px-4 py-3 text-[#766A63]">{c.phone ?? "—"}</td>
                <td className="px-4 py-3">
                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-[600] tracking-wide uppercase ${c.is_guest ? "bg-[#F7F2EC] text-[#766A63]" : "bg-[#F5DDE5] text-[#221A33]"}`}>
                    {c.is_guest ? "Invitada" : "Registrada"}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  {c.marketing_email ? "✓" : "—"}
                </td>
                <td className="px-4 py-3 text-xs text-[#766A63] whitespace-nowrap">
                  {formatDateShort(c.created_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
