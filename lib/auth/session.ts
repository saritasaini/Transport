import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import type { AppModule, UserProfile, UserRole } from "@/types/database";
import { ROLE_DEFAULT_MODULES } from "@/lib/constants";
import { TENANT_COOKIE } from "@/lib/auth/constants";

export interface SessionContext {
  userId: string;
  email: string;
  profile: UserProfile;
  companyId: string | null;
  effectiveCompanyId: string | null;
  activeTenantName: string | null;
  isSuperAdmin: boolean;
  role: UserRole;
  modules: AppModule[];
}

export async function getSessionContext(): Promise<SessionContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile || !profile.is_active) return null;

  const role = profile.role as UserRole;
  const isSuperAdmin = role === "super_admin";

  let modules: AppModule[] = ROLE_DEFAULT_MODULES[role];

  if (role === "sub_admin") {
    const { data: perms } = await supabase
      .from("user_module_permissions")
      .select("module")
      .eq("user_id", user.id)
      .eq("can_read", true);
    modules = (perms?.map((p) => p.module as AppModule) ?? ["dashboard"]) as AppModule[];
  }

  let effectiveCompanyId: string | null = profile.company_id;
  let activeTenantName: string | null = null;

  if (isSuperAdmin) {
    const cookieStore = await cookies();
    const tenantCookie = cookieStore.get(TENANT_COOKIE)?.value;
    if (tenantCookie) {
      const { data: company } = await supabase
        .from("companies")
        .select("id, name, is_active")
        .eq("id", tenantCookie)
        .single();
      if (company && company.is_active !== false) {
        effectiveCompanyId = company.id;
        activeTenantName = company.name;
      }
    } else {
      effectiveCompanyId = null;
    }
  } else if (effectiveCompanyId) {
    const { data: company } = await supabase
      .from("companies")
      .select("name")
      .eq("id", effectiveCompanyId)
      .single();
    activeTenantName = company?.name ?? null;
  }

  return {
    userId: user.id,
    email: user.email ?? "",
    profile: profile as UserProfile,
    companyId: profile.company_id,
    effectiveCompanyId,
    activeTenantName,
    isSuperAdmin,
    role,
    modules,
  };
}

export function canAccessModule(ctx: SessionContext, module: AppModule): boolean {
  if (ctx.role === "super_admin") return true;
  return ctx.modules.includes(module);
}
