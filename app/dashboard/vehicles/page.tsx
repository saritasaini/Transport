import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth/session";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { formatDateIN } from "@/lib/utils/format";

export default async function VehiclesPage() {
  const ctx = await getSessionContext();
  const supabase = await createClient();
  const { data: vehicles } = await supabase
    .from("vehicles")
    .select("*")
    .eq("company_id", ctx!.effectiveCompanyId!)
    .is("deleted_at", null)
    .order("registration_number");

  return (
    <div>
      <PageHeader
        title="Vehicles"
        action={
          <Button asChild variant="outline">
            <Link href="/dashboard/vehicles/new">Add vehicle</Link>
          </Button>
        }
      />
      {!vehicles?.length ? (
        <EmptyState
          title="No vehicles"
          description="Add your fleet vehicles to assign trips."
          action={
            <Button asChild variant="outline">
              <Link href="/dashboard/vehicles/new">Add vehicle</Link>
            </Button>
          }
        />
      ) : (
        <SectionPanel title="Fleet vehicles" contentClassName="p-0">
          <DataTableShell>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Registration</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Insurance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vehicles.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell>
                      <Link
                        href={`/dashboard/vehicles/${v.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {v.registration_number}
                      </Link>
                    </TableCell>
                    <TableCell>{v.vehicle_type ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{v.current_status}</Badge>
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {formatDateIN(v.insurance_expiry)}
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
