"use server";

import { revalidatePath } from "next/cache";
import { getSessionContext } from "@/lib/auth/session";
import { requireTenant } from "@/lib/auth/tenant";
import { createClient } from "@/lib/supabase/server";
import { tripSchema, tripStatusSchema } from "@/lib/validations/trip";
import { softDeleteRecord } from "@/lib/soft-delete";
import type { TripStatus } from "@/types/database";

const ALLOWED_TRANSITIONS: Record<TripStatus, TripStatus[]> = {
  pending: ["assigned", "cancelled"],
  assigned: ["in_transit", "hold", "cancelled"],
  in_transit: ["hold", "completed", "cancelled"],
  hold: ["in_transit", "cancelled"],
  cancelled: [],
  completed: [],
};

export async function createTrip(formData: FormData) {
  let ctx;
  let companyId: string;
  try {
    ({ ctx, companyId } = await requireTenant());
  } catch {
    return { error: "Unauthorized" };
  }

  const raw = Object.fromEntries(formData.entries());
  const parsed = tripSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("trips")
    .insert({
      ...parsed.data,
      company_id: companyId,
      status: "pending",
      created_by: ctx.userId,
    })
    .select()
    .single();

  if (error) return { error: error.message };
  revalidatePath("/dashboard/trips");
  return { data };
}

export async function updateTrip(tripId: string, formData: FormData) {
  let ctx;
  let companyId: string;
  try {
    ({ ctx, companyId } = await requireTenant());
  } catch {
    return { error: "Unauthorized" };
  }

  const raw = Object.fromEntries(formData.entries());
  const parsed = tripSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  
  // check if locked
  const { data: trip } = await supabase.from("trips").select("is_locked").eq("id", tripId).single();
  if (trip?.is_locked && !["transporter_admin", "super_admin"].includes(ctx.role)) {
    return { error: "Trip is locked. Contact admin to modify." };
  }

  const { data, error } = await supabase
    .from("trips")
    .update({ ...parsed.data })
    .eq("id", tripId)
    .eq("company_id", companyId)
    .select()
    .single();

  if (error) return { error: error.message };
  revalidatePath(`/dashboard/trips/${tripId}`);
  revalidatePath("/dashboard/trips");
  return { data };
}

export async function updateTripStatus(tripId: string, formData: FormData) {
  let ctx;
  let companyId: string;
  try {
    ({ ctx, companyId } = await requireTenant());
  } catch {
    return { error: "Unauthorized" };
  }

  const raw = Object.fromEntries(formData.entries());
  const parsed = tripStatusSchema.safeParse(raw);
  if (!parsed.success) return { error: "Invalid status update" };

  const supabase = await createClient();
  const { data: trip } = await supabase
    .from("trips")
    .select("*")
    .eq("id", tripId)
    .eq("company_id", companyId)
    .single();

  if (!trip) return { error: "Trip not found" };
  if (trip.is_locked && !["transporter_admin", "super_admin"].includes(ctx.role)) {
    return { error: "Trip is locked. Contact admin to modify." };
  }

  const next = parsed.data.status as TripStatus;
  const allowed = ALLOWED_TRANSITIONS[trip.status as TripStatus] ?? [];
  if (!allowed.includes(next)) {
    return { error: `Cannot transition from ${trip.status} to ${next}` };
  }

  if (next === "completed") {
    if (
      parsed.data.odometer_end == null ||
      trip.odometer_start == null ||
      parsed.data.odometer_end <= trip.odometer_start
    ) {
      return { error: "Odometer end must be greater than odometer start." };
    }
  }

  const { error } = await supabase
    .from("trips")
    .update({
      status: next,
      odometer_end: parsed.data.odometer_end ?? trip.odometer_end,
    })
    .eq("id", tripId);

  if (error) return { error: error.message };

  if (["assigned", "completed"].includes(next)) {
    await supabase.from("notifications").insert({
      company_id: companyId,
      type: "trip_status",
      title: `Trip ${trip.trip_number}`,
      message: `Status changed to ${next}`,
      related_entity_type: "trip",
      related_entity_id: tripId,
    });
  }

  revalidatePath(`/dashboard/trips/${tripId}`);
  revalidatePath("/dashboard/trips");
  return { success: true };
}

export async function deleteTrip(tripId: string) {
  let ctx;
  let companyId: string;
  let supabase;
  try {
    ({ ctx, companyId, supabase } = await requireTenant());
  } catch {
    return { error: "Unauthorized" };
  }
  const { data: trip } = await supabase
    .from("trips")
    .select("*")
    .eq("id", tripId)
    .single();

  if (!trip) return { error: "Not found" };

  await softDeleteRecord(supabase, {
    companyId,
    entityType: "trip",
    entityId: tripId,
    table: "trips",
    data: trip,
    deletedBy: ctx.userId,
  });

  revalidatePath("/dashboard/trips");
  return { success: true };
}

export async function unlockTrip(tripId: string) {
  const ctx = await getSessionContext();
  if (!["transporter_admin", "super_admin"].includes(ctx?.role ?? "")) {
    return { error: "Forbidden" };
  }
  const supabase = await createClient();
  await supabase.from("trips").update({ is_locked: false }).eq("id", tripId);
  revalidatePath(`/dashboard/trips/${tripId}`);
  return { success: true };
}
