import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth/session";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { SectionPanel } from "@/components/shared/section-panel";
import { DataTableShell } from "@/components/shared/data-table-shell";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Users } from "lucide-react";

export default async function UsersPage() {
  const ctx = await getSessionContext();
  const supabase = await createClient();
  const { data: users } = await supabase
    .from("users")
    .select("*")
    .eq("company_id", ctx!.effectiveCompanyId!)
    .order("full_name");

  const rows = users ?? [];

  return (
    <div>
      <PageHeader
        title="User Management"
        description="Transporter Admin can create sub-admins and assign module permissions."
      />
      {!rows.length ? (
        <EmptyState
          icon={Users}
          title="No users"
          description="Team members with access to Fleet Control will appear here."
        />
      ) : (
        <SectionPanel title="Team members" contentClassName="p-0">
          <DataTableShell>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>Last login</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.full_name}</TableCell>
                    <TableCell className="capitalize">
                      {u.role.replace(/_/g, " ")}
                    </TableCell>
                    <TableCell>{u.is_active ? "Yes" : "No"}</TableCell>
                    <TableCell className="tabular-nums">
                      {u.last_login_at ?? "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </DataTableShell>
        </SectionPanel>
      )}
    </div>
  );
}
