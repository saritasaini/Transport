import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext, type SessionContext } from "@/lib/auth/session";

import { TENANT_COOKIE } from "@/lib/auth/constants";

export { TENANT_COOKIE };

export async function getTenantCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(TENANT_COOKIE)?.value ?? null;
}

export async function requireSuperAdmin(): Promise<SessionContext> {
  const ctx = await getSessionContext();
  if (!ctx || ctx.role !== "super_admin") {
    throw new Error("Forbidden");
  }
  return ctx;
}

export async function requireTenant() {
  const ctx = await getSessionContext();
  if (!ctx) throw new Error("Unauthorized");
  const companyId = ctx.effectiveCompanyId;
  if (!companyId) throw new Error("No active tenant");
  const supabase = await createClient();
  return { ctx, companyId, supabase };
}
