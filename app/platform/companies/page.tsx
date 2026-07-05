import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { SectionPanel } from "@/components/shared/section-panel";
import { DataTableShell } from "@/components/shared/data-table-shell";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateIN } from "@/lib/utils/format";
import { Building2, Plus } from "lucide-react";
import { openTenantWorkspace } from "@/actions/platform";

export default async function PlatformCompaniesPage() {
  const supabase = await createClient();
  const { data: companies } = await supabase
    .from("companies")
    .select("id, name, email, plan, gstin, is_active, created_at")
    .order("name");

  return (
    <div>
      <PageHeader
        title="Companies"
        description="All tenant organizations on the platform"
        action={
          <Button asChild>
            <Link href="/platform/companies/new">
              <Plus className="h-4 w-4" />
              New company
            </Link>
          </Button>
        }
      />
      {!companies?.length ? (
        <EmptyState
          icon={Building2}
          title="No companies"
          description="Create the first transport company to onboard a tenant."
          action={
            <Button asChild>
              <Link href="/platform/companies/new">Create company</Link>
            </Button>
          }
        />
      ) : (
        <SectionPanel title="Tenant directory" contentClassName="p-0">
          <DataTableShell>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companies.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <Link
                        href={`/platform/companies/${c.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {c.name}
                      </Link>
                      {c.email && (
                        <p className="text-2xs text-muted-foreground">{c.email}</p>
                      )}
                    </TableCell>
                    <TableCell className="capitalize">{c.plan ?? "starter"}</TableCell>
                    <TableCell>
                      <Badge variant={c.is_active === false ? "outline" : "default"}>
                        {c.is_active === false ? "Inactive" : "Active"}
                      </Badge>
                    </TableCell>
                    <TableCell className="tabular-nums text-muted-foreground">
                      {formatDateIN(c.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      {c.is_active !== false && (
                        <form action={openTenantWorkspace}>
                          <input type="hidden" name="companyId" value={c.id} />
                          <Button type="submit" size="sm" variant="outline">
                            Open workspace
                          </Button>
                        </form>
                      )}
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
