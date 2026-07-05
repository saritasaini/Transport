import type { SupabaseClient } from "@supabase/supabase-js";

export async function softDeleteRecord(
  supabase: SupabaseClient,
  opts: {
    companyId: string;
    entityType: string;
    entityId: string;
    table: string;
    data: Record<string, unknown>;
    deletedBy: string;
    retentionDays?: number;
  }
) {
  const retentionDays = opts.retentionDays ?? 90;
  const retentionUntil = new Date();
  retentionUntil.setDate(retentionUntil.getDate() + retentionDays);

  await supabase.from("deleted_records").insert({
    company_id: opts.companyId,
    entity_type: opts.entityType,
    entity_id: opts.entityId,
    data: opts.data,
    deleted_by: opts.deletedBy,
    retention_until: retentionUntil.toISOString(),
  });

  const { error } = await supabase
    .from(opts.table)
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", opts.entityId);

  if (error) throw new Error(error.message);

  await supabase.from("audit_logs").insert({
    company_id: opts.companyId,
    user_id: opts.deletedBy,
    action: "delete",
    entity_type: opts.entityType,
    entity_id: opts.entityId,
    old_data: opts.data,
  });
}

export async function restoreRecord(
  supabase: SupabaseClient,
  deletedRecordId: string,
  table: string,
  userId: string
) {
  const { data: rec, error } = await supabase
    .from("deleted_records")
    .select("*")
    .eq("id", deletedRecordId)
    .single();

  if (error || !rec) throw new Error("Deleted record not found");
  if (rec.restored_at) throw new Error("Already restored");
  if (new Date(rec.retention_until) < new Date()) {
    throw new Error("Retention period expired");
  }

  const { error: restoreErr } = await supabase
    .from(table)
    .update({ deleted_at: null })
    .eq("id", rec.entity_id);

  if (restoreErr) throw new Error(restoreErr.message);

  await supabase
    .from("deleted_records")
    .update({ restored_at: new Date().toISOString() })
    .eq("id", deletedRecordId);

  await supabase.from("audit_logs").insert({
    company_id: rec.company_id,
    user_id: userId,
    action: "restore",
    entity_type: rec.entity_type,
    entity_id: rec.entity_id,
    new_data: rec.data,
  });
}
