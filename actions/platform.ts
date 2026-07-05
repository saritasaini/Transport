"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { TENANT_COOKIE } from "@/lib/auth/constants";
import { requireSuperAdmin } from "@/lib/auth/tenant";

const companySchema = z.object({
  name: z.string().min(1).max(150),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().max(20).optional(),
  address: z.string().optional(),
  plan: z.enum(["starter", "pro", "enterprise"]).default("starter"),
  gstin: z.string().max(20).optional(),
  retention_days: z.coerce.number().int().min(1).max(365).default(90),
});

export async function createCompany(formData: FormData) {
  await requireSuperAdmin();
  const raw = Object.fromEntries(formData.entries());
  const parsed = companySchema.safeParse(raw);
  if (!parsed.success) return { error: "Validation failed" };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("companies")
    .insert({
      name: parsed.data.name,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      address: parsed.data.address || null,
      plan: parsed.data.plan,
      gstin: parsed.data.gstin || null,
      retention_days: parsed.data.retention_days,
      is_active: true,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/platform");
  revalidatePath("/platform/companies");
  return { success: true, id: data.id };
}

export async function updateCompany(id: string, formData: FormData) {
  await requireSuperAdmin();
  const raw = Object.fromEntries(formData.entries());
  const parsed = companySchema.safeParse(raw);
  if (!parsed.success) return { error: "Validation failed" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("companies")
    .update({
      name: parsed.data.name,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      address: parsed.data.address || null,
      plan: parsed.data.plan,
      gstin: parsed.data.gstin || null,
      retention_days: parsed.data.retention_days,
    })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/platform/companies");
  revalidatePath(`/platform/companies/${id}`);
  return { success: true };
}

export async function setCompanyActive(id: string, isActive: boolean) {
  await requireSuperAdmin();
  const supabase = await createClient();
  const { error } = await supabase
    .from("companies")
    .update({ is_active: isActive })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/platform/companies");
  revalidatePath(`/platform/companies/${id}`);
  return { success: true };
}

export async function toggleCompanyActive(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const isActive = formData.get("isActive") === "true";
  await setCompanyActive(id, isActive);
}

export async function openTenantWorkspace(formData: FormData): Promise<void> {
  const companyId = String(formData.get("companyId") ?? "");
  if (!companyId) return;
  await setActiveTenant(companyId);
}

export async function setActiveTenant(companyId: string): Promise<{ error?: string } | void> {
  await requireSuperAdmin();
  const supabase = await createClient();
  const { data: company } = await supabase
    .from("companies")
    .select("id, is_active")
    .eq("id", companyId)
    .single();

  if (!company || company.is_active === false) {
    return { error: "Company not found or inactive" };
  }

  const cookieStore = await cookies();
  cookieStore.set(TENANT_COOKIE, companyId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  redirect("/dashboard");
}

export async function clearActiveTenant() {
  await requireSuperAdmin();
  const cookieStore = await cookies();
  cookieStore.delete(TENANT_COOKIE);
  redirect("/platform");
}
