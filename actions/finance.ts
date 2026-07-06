"use server";

import { revalidatePath } from "next/cache";
import { requireTenant } from "@/lib/auth/tenant";
import { createClient } from "@/lib/supabase/server";
import { expenseSchema, paymentSchema, challanSchema } from "@/lib/validations/master";

import { softDeleteRecord } from "@/lib/soft-delete";

export async function upsertExpense(formData: FormData, id?: string) {
  let ctx;
  let companyId: string;
  try {
    ({ ctx, companyId } = await requireTenant());
  } catch {
    return { error: "Unauthorized" };
  }

  const parsed = expenseSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Validation failed" };

  const payload = { ...parsed.data, company_id: companyId };
  if (!id) {
    (payload as any).created_by = ctx.userId;
  }

  const supabase = await createClient();
  const { error } = id
    ? await supabase.from("trip_expenses").update(payload).eq("id", id)
    : await supabase.from("trip_expenses").insert(payload);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/expenses");
  revalidatePath(`/dashboard/trips/${parsed.data.trip_id}`);
  return { success: true };
}

export async function deleteExpense(id: string) {
  let ctx;
  let companyId: string;
  let supabase;
  try {
    ({ ctx, companyId, supabase } = await requireTenant());
  } catch {
    return { error: "Unauthorized" };
  }
  
  const { data } = await supabase.from("trip_expenses").select("*").eq("id", id).single();
  if (!data) return { error: "Not found" };
  
  await softDeleteRecord(supabase, {
    companyId,
    entityType: "trip_expense",
    entityId: id,
    table: "trip_expenses",
    data,
    deletedBy: ctx.userId,
  });
  
  revalidatePath("/dashboard/expenses");
  revalidatePath(`/dashboard/trips/${data.trip_id}`);
  return { success: true };
}

export async function upsertPayment(formData: FormData, id?: string) {
  let ctx;
  let companyId: string;
  try {
    ({ ctx, companyId } = await requireTenant());
  } catch {
    return { error: "Unauthorized" };
  }

  const parsed = paymentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Validation failed" };

  const payload = { ...parsed.data, company_id: companyId };
  
  if (payload.net_received == null) {
    payload.net_received = payload.amount - (payload.tds_deducted || 0);
  }

  if (!id) {
    (payload as any).created_by = ctx.userId;
  }

  const { data: payment, error } = id
    ? await supabase
        .from("payments")
        .update(payload)
        .eq("id", id)
        .select()
        .single()
    : await supabase
        .from("payments")
        .insert(payload)
        .select()
        .single();

  if (error) {
    console.error("Supabase Error:", error.message);
    return { error: error.message };
  }

  // Manual fallback to update trip payment_status if no bill exists yet
  if (payment && payment.trip_id) {
    const { data: allPayments } = await supabase
      .from("payments")
      .select("amount")
      .eq("trip_id", payment.trip_id)
      .is("deleted_at", null);
      
    const totalPaid = allPayments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
    const { data: trip } = await supabase
      .from("trips")
      .select("bill_amount")
      .eq("id", payment.trip_id)
      .single();
      
    if (trip) {
      let newStatus = 'unpaid';
      if (totalPaid > 0 && totalPaid < Number(trip.bill_amount || 0)) newStatus = 'partially_paid';
      else if (totalPaid > 0 && totalPaid >= Number(trip.bill_amount || 0)) newStatus = 'paid';
      
      await supabase.from("trips").update({ payment_status: newStatus }).eq("id", payment.trip_id);
    }
  }

  revalidatePath("/dashboard/payments");
  revalidatePath(`/dashboard/trips/${parsed.data.trip_id}`);
  return { success: true };
}

export async function deletePayment(id: string) {
  let ctx;
  let companyId: string;
  let supabase;
  try {
    ({ ctx, companyId, supabase } = await requireTenant());
  } catch {
    return { error: "Unauthorized" };
  }
  
  const { data } = await supabase.from("payments").select("*").eq("id", id).single();
  if (!data) return { error: "Not found" };
  
  await softDeleteRecord(supabase, {
    companyId,
    entityType: "payment",
    entityId: id,
    table: "payments",
    data,
    deletedBy: ctx.userId,
  });
  
  revalidatePath("/dashboard/payments");
  revalidatePath(`/dashboard/trips/${data.trip_id}`);
  return { success: true };
}

export async function upsertChallan(formData: FormData, id?: string) {
  let ctx;
  let companyId: string;
  try {
    ({ ctx, companyId } = await requireTenant());
  } catch {
    return { error: "Unauthorized" };
  }

  const parsed = challanSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Validation failed" };

  const payload = { ...parsed.data, company_id: companyId };
  if (!id) {
    (payload as any).created_by = ctx.userId;
  }

  const supabase = await createClient();
  const { error } = id
    ? await supabase.from("challans").update(payload).eq("id", id)
    : await supabase.from("challans").insert(payload);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/challans");
  return { success: true };
}

export async function deleteChallan(id: string) {
  let ctx;
  let companyId: string;
  let supabase;
  try {
    ({ ctx, companyId, supabase } = await requireTenant());
  } catch {
    return { error: "Unauthorized" };
  }
  
  const { data } = await supabase.from("challans").select("*").eq("id", id).single();
  if (!data) return { error: "Not found" };
  
  await softDeleteRecord(supabase, {
    companyId,
    entityType: "challan",
    entityId: id,
    table: "challans",
    data,
    deletedBy: ctx.userId,
  });
  
  revalidatePath("/dashboard/challans");
  return { success: true };
}

export async function markNotificationRead(id: string) {
  const supabase = await createClient();
  await supabase.from("notifications").update({ is_read: true }).eq("id", id);
  revalidatePath("/dashboard/notifications");
}
