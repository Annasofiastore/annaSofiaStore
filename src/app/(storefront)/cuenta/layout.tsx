import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";
import AccountSidebar from "@/components/cuenta/AccountSidebar";

export default async function CuentaLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login?redirect=/cuenta");

  const db = createServiceClient();

  // Buscar por auth_user_id, si no encontrado buscar por email y vincular
  let displayName = user.email ?? "Mi cuenta";
  const { data: byAuthId } = await db
    .from("customers")
    .select("id, full_name")
    .eq("auth_user_id", user.id)
    .single();

  if (byAuthId) {
    displayName = byAuthId.full_name ?? displayName;
  } else if (user.email) {
    const { data: byEmail } = await db
      .from("customers")
      .select("id, full_name")
      .eq("email", user.email.toLowerCase())
      .single();

    if (byEmail) {
      displayName = byEmail.full_name ?? displayName;
      await db
        .from("customers")
        .update({ auth_user_id: user.id, is_guest: false })
        .eq("id", byEmail.id);
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF6F7]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="mb-6">
          <p className="text-[10px] tracking-[0.28em] uppercase text-[#A0647E] font-[500]">
            Mi cuenta
          </p>
          <h1
            className="text-2xl text-[#1E1B2E] mt-1"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {displayName}
          </h1>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          <AccountSidebar />
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </div>
  );
}
