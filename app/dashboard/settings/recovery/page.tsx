import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth/session";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ListPanel, ListPanelItem } from "@/components/shared/list-panel";
import { restoreDeletedRecord } from "@/actions/recovery";
import { Button } from "@/components/ui/button";
import { formatDateIN } from "@/lib/utils/format";
import { Archive } from "lucide-react";

export default async function RecoveryPage() {
  const ctx = await getSessionContext();
  const supabase = await createClient();
  const { data: records } = await supabase
    .from("deleted_records")
    .select("*")
    .eq("company_id", ctx!.effectiveCompanyId!)
    .is("restored_at", null)
    .order("deleted_at", { ascending: false });

  const rows = records ?? [];

  return (
    <div>
      <PageHeader
        title="Deleted Records & Recovery"
        description="Restore soft-deleted records within the retention window"
      />
      {!rows.length ? (
        <EmptyState
          icon={Archive}
          title="No deleted records"
          description="Soft-deleted items available for recovery will appear here."
        />
      ) : (
        <ListPanel>
          {rows.map((r) => (
            <ListPanelItem key={r.id}>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-foreground">
                  {r.entity_type} · {r.entity_id.slice(0, 8)}…
                </p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Deleted {formatDateIN(r.deleted_at)} · Retention until{" "}
                  {formatDateIN(r.retention_until)}
                </p>
              </div>
              <form action={restoreDeletedRecord.bind(null, r.id)}>
                <Button type="submit" size="sm" className="min-h-11 sm:min-h-9">
                  Restore
                </Button>
              </form>
            </ListPanelItem>
          ))}
        </ListPanel>
      )}
    </div>
  );
}
