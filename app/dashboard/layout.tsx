import { requireDashboardTenant } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await requireDashboardTenant();

  const supabase = await createClient();
  let unreadCount = 0;
  if (ctx.effectiveCompanyId) {
    const { count } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("company_id", ctx.effectiveCompanyId)
      .eq("is_read", false);
    unreadCount = count ?? 0;
  }

  return (
    <DashboardShell modules={ctx.modules} ctx={ctx} unreadCount={unreadCount}>
      {children}
    </DashboardShell>
  );
}
