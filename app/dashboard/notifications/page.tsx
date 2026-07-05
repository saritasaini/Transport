import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth/session";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ListPanel, ListPanelItem } from "@/components/shared/list-panel";
import { markNotificationRead } from "@/actions/finance";
import { Button } from "@/components/ui/button";
import { formatDateIN } from "@/lib/utils/format";
import { Bell } from "lucide-react";

export default async function NotificationsPage() {
  const ctx = await getSessionContext();
  const supabase = await createClient();
  const { data: items } = await supabase
    .from("notifications")
    .select("*")
    .eq("company_id", ctx!.effectiveCompanyId!)
    .order("created_at", { ascending: false })
    .limit(50);

  const rows = items ?? [];

  return (
    <div>
      <PageHeader
        title="Notifications"
        description="Alerts for trips, documents, and payments"
      />
      {!rows.length ? (
        <EmptyState
          icon={Bell}
          title="No notifications"
          description="You're all caught up. New alerts will appear here."
        />
      ) : (
        <ListPanel>
          {rows.map((n) => (
            <ListPanelItem key={n.id} highlighted={!n.is_read}>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-foreground">{n.title}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">{n.message}</p>
                <p className="mt-1 text-2xs text-muted-foreground">
                  {formatDateIN(n.created_at)}
                </p>
              </div>
              {!n.is_read && (
                <form action={markNotificationRead.bind(null, n.id)}>
                  <Button type="submit" size="sm" variant="outline" className="min-h-11 sm:min-h-9">
                    Mark read
                  </Button>
                </form>
              )}
            </ListPanelItem>
          ))}
        </ListPanel>
      )}
    </div>
  );
}
