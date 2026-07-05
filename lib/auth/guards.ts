import { redirect } from "next/navigation";
import { getSessionContext } from "@/lib/auth/session";

export async function requireDashboardTenant() {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/login");
  if (!ctx.effectiveCompanyId) {
    if (ctx.isSuperAdmin) redirect("/platform");
    redirect("/login?error=no_company");
  }
  return ctx;
}

export async function requirePlatformAdmin() {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/login");
  if (!ctx.isSuperAdmin) redirect("/dashboard");
  return ctx;
}
