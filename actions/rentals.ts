"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth/session";

export async function createRental(data: any) {
  try {
    const ctx = await getSessionContext();
    if (!ctx?.effectiveCompanyId) {
      return { success: false, error: "Unauthorized" };
    }

    const supabase = await createClient();

    const { error } = await supabase.from("rent_in_rent_out").insert({
      company_id: ctx.effectiveCompanyId,
      type: data.type,
      vendor_id: data.vendor_id,
      vehicle_description: data.vehicle_description,
      vehicle_number: data.vehicle_number,
      vehicle_id: data.vehicle_id || null,
      start_date: data.start_date,
      end_date: data.end_date || null,
      agreed_rate: Number(data.agreed_rate) || null,
      rate_unit: data.rate_unit || 'per_day',
      total_amount: Number(data.total_amount) || null,
      status: data.status || 'active',
      notes: data.notes || null,
      created_by: ctx.userId,
    });

    if (error) {
      console.error("Supabase insert error:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/rentals");
    return { success: true };
  } catch (err: any) {
    console.error("Action error:", err);
    return { success: false, error: err.message };
  }
}

export async function updateRental(id: string, data: any) {
  try {
    const ctx = await getSessionContext();
    if (!ctx?.effectiveCompanyId) {
      return { success: false, error: "Unauthorized" };
    }

    const supabase = await createClient();

    const { error } = await supabase.from("rent_in_rent_out")
      .update({
        type: data.type,
        vendor_id: data.vendor_id,
        vehicle_description: data.vehicle_description,
        vehicle_number: data.vehicle_number,
        vehicle_id: data.vehicle_id || null,
        start_date: data.start_date,
        end_date: data.end_date || null,
        agreed_rate: Number(data.agreed_rate) || null,
        rate_unit: data.rate_unit || 'per_day',
        total_amount: Number(data.total_amount) || null,
        status: data.status || 'active',
        notes: data.notes || null,
      })
      .eq("id", id)
      .eq("company_id", ctx.effectiveCompanyId);

    if (error) {
      console.error("Supabase update error:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/rentals");
    return { success: true };
  } catch (err: any) {
    console.error("Action error:", err);
    return { success: false, error: err.message };
  }
}

export async function softDeleteRental(id: string) {
  try {
    const ctx = await getSessionContext();
    if (!ctx?.effectiveCompanyId) {
      return { success: false, error: "Unauthorized" };
    }

    const supabase = await createClient();

    const { error } = await supabase.from("rent_in_rent_out")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id)
      .eq("company_id", ctx.effectiveCompanyId);

    if (error) {
      console.error("Supabase delete error:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/rentals");
    return { success: true };
  } catch (err: any) {
    console.error("Action error:", err);
    return { success: false, error: err.message };
  }
}
