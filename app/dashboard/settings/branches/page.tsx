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
import { MapPin } from "lucide-react";

export default async function BranchesPage() {
  const ctx = await getSessionContext();
  const supabase = await createClient();
  const { data: branches } = await supabase
    .from("branches")
    .select("*")
    .eq("company_id", ctx!.effectiveCompanyId!)
    .order("name");

  const rows = branches ?? [];

  return (
    <div>
      <PageHeader title="Branches" description="Company branch locations" />
      {!rows.length ? (
        <EmptyState
          icon={MapPin}
          title="No branches"
          description="Branch records will appear here once configured."
        />
      ) : (
        <SectionPanel title="All branches" contentClassName="p-0">
          <DataTableShell>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Active</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium">{b.name}</TableCell>
                    <TableCell>{b.location ?? "—"}</TableCell>
                    <TableCell>{b.is_active ? "Yes" : "No"}</TableCell>
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
