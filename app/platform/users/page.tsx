import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { SectionPanel } from "@/components/shared/section-panel";
import { DataTableShell } from "@/components/shared/data-table-shell";
import { EmptyState } from "@/components/shared/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Users } from "lucide-react";

function resolveCompanyName(
  companyId: string | null,
  companies: { name: string } | { name: string }[] | null
): string {
  if (!companyId) return "Platform";
  if (!companies) return "—";
  if (Array.isArray(companies)) return companies[0]?.name ?? "—";
  return companies.name;
}

export default async function PlatformUsersPage() {
  const supabase = await createClient();
  const { data: users } = await supabase
    .from("users")
    .select("id, full_name, role, is_active, company_id, last_login_at, companies(name)")
    .order("full_name");

  return (
    <div>
      <PageHeader
        title="Users"
        description="All users across tenant companies"
      />
      {!users?.length ? (
        <EmptyState icon={Users} title="No users" description="Users appear after Auth signup and profile creation." />
      ) : (
        <SectionPanel title="User directory" contentClassName="p-0">
          <DataTableShell>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>Last login</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.full_name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {resolveCompanyName(
                        u.company_id,
                        u.companies as { name: string } | { name: string }[] | null
                      )}
                    </TableCell>
                    <TableCell className="capitalize">
                      {u.role.replace(/_/g, " ")}
                    </TableCell>
                    <TableCell>{u.is_active ? "Yes" : "No"}</TableCell>
                    <TableCell className="tabular-nums text-muted-foreground">
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
