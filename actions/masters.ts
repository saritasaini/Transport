"use server";

import { revalidatePath } from "next/cache";
import { requireTenant } from "@/lib/auth/tenant";
import {
  branchSchema,
  driverSchema,
  partySchema,
  vehicleSchema,
} from "@/lib/validations/master";
import { softDeleteRecord } from "@/lib/soft-delete";


export async function upsertBranch(formData: FormData, id?: string) {
  const { ctx, companyId, supabase } = await requireTenant();
  const parsed = branchSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Validation failed" };

  const payload = { ...parsed.data, company_id: companyId };
  const { error } = id
    ? await supabase.from("branches").update(payload).eq("id", id)
    : await supabase.from("branches").insert(payload);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/settings/branches");
  return { success: true };
}

export async function upsertParty(formData: FormData, id?: string) {
  const { companyId, supabase } = await requireTenant();
  const parsed = partySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Validation failed" };

  const payload = { ...parsed.data, company_id: companyId };
  const { error } = id
    ? await supabase.from("customers_parties").update(payload).eq("id", id)
    : await supabase.from("customers_parties").insert(payload);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/parties");
  return { success: true };
}

export async function upsertDriver(formData: FormData, id?: string) {
  const { companyId, supabase } = await requireTenant();
  const parsed = driverSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Validation failed" };

  const payload = { ...parsed.data, company_id: companyId };
  const { error } = id
    ? await supabase.from("drivers").update(payload).eq("id", id)
    : await supabase.from("drivers").insert(payload);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/drivers");
  return { success: true };
}

export async function upsertVehicle(formData: FormData, id?: string) {
  const { companyId, supabase } = await requireTenant();
  const parsed = vehicleSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Validation failed" };

  const payload = { ...parsed.data, company_id: companyId };
  const { error } = id
    ? await supabase.from("vehicles").update(payload).eq("id", id)
    : await supabase.from("vehicles").insert(payload);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/vehicles");
  return { success: true };
}

export async function toggleDriverActive(id: string, isActive: boolean) {
  const { supabase } = await requireTenant();
  await supabase.from("drivers").update({ is_active: isActive }).eq("id", id);
  revalidatePath("/dashboard/drivers");
  return { success: true };
}

export async function softDeleteDriver(id: string) {
  const { ctx, companyId, supabase } = await requireTenant();
  const { data } = await supabase.from("drivers").select("*").eq("id", id).single();
  if (!data) return { error: "Not found" };
  await softDeleteRecord(supabase, {
    companyId,
    entityType: "driver",
    entityId: id,
    table: "drivers",
    data,
    deletedBy: ctx.userId,
  });
  revalidatePath("/dashboard/drivers");
  return { success: true };
}
