"use server";

import { revalidatePath } from "next/cache";
import { requireTenant } from "@/lib/auth/tenant";
import { createClient } from "@/lib/supabase/server";
import { expenseSchema, paymentSchema } from "@/lib/validations/master";

export async function createExpense(formData: FormData) {
  let ctx;
  let companyId: string;
  try {
    ({ ctx, companyId } = await requireTenant());
  } catch {
    return { error: "Unauthorized" };
  }

  const parsed = expenseSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Validation failed" };

  const supabase = await createClient();
  const { error } = await supabase.from("trip_expenses").insert({
    ...parsed.data,
    company_id: companyId,
    created_by: ctx.userId,
  });

  if (error) return { error: error.message };
  revalidatePath("/dashboard/expenses");
  revalidatePath(`/dashboard/trips/${parsed.data.trip_id}`);
  return { success: true };
}

export async function createPayment(formData: FormData) {
  let ctx;
  let companyId: string;
  try {
    ({ ctx, companyId } = await requireTenant());
  } catch {
    return { error: "Unauthorized" };
  }

  const parsed = paymentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Validation failed" };

  const supabase = await createClient();
  const { error } = await supabase.from("payments").insert({
    ...parsed.data,
    company_id: companyId,
    created_by: ctx.userId,
  });

  if (error) return { error: error.message };
  revalidatePath("/dashboard/payments");
  return { success: true };
}

export async function markNotificationRead(id: string) {
  const supabase = await createClient();
  await supabase.from("notifications").update({ is_read: true }).eq("id", id);
  revalidatePath("/dashboard/notifications");
}
