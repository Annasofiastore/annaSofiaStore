import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.app_metadata?.role !== "admin") {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen bg-[#F7F2EC]">
      <AdminSidebar />
      <main className="flex-1 md:ml-60 p-4 pt-20 md:p-8 min-h-screen min-w-0">{children}</main>
    </div>
  );
}
