"use server";

import { revalidatePath } from "next/cache";
import { getSessionContext } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { restoreRecord } from "@/lib/soft-delete";

const ENTITY_TABLE: Record<string, string> = {
  trip: "trips",
  driver: "drivers",
  vehicle: "vehicles",
  expense: "trip_expenses",
  party: "customers_parties",
};

export async function restoreDeletedRecord(deletedRecordId: string) {
  const ctx = await getSessionContext();
  if (!ctx) throw new Error("Unauthorized");
  if (!["transporter_admin", "super_admin"].includes(ctx.role)) {
    throw new Error("Forbidden");
  }

  const supabase = await createClient();
  const { data: rec } = await supabase
    .from("deleted_records")
    .select("*")
    .eq("id", deletedRecordId)
    .single();

  if (!rec) throw new Error("Not found");
  const table = ENTITY_TABLE[rec.entity_type];
  if (!table) throw new Error("Unknown entity type");

  await restoreRecord(supabase, deletedRecordId, table, ctx.userId);
  revalidatePath("/dashboard/settings/recovery");
}
