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
import { formatDateIN, daysUntil, expiryBadgeVariant } from "@/lib/utils/format";
import { RowActions } from "@/components/shared/row-actions";
import { softDeleteDriver } from "@/actions/masters";
import { DriverForm } from "@/components/drivers/driver-form";
import { cn } from "@/lib/utils";

export default async function DriversPage() {
  const ctx = await getSessionContext();
  const supabase = await createClient();
  const { data: drivers } = await supabase
    .from("drivers")
    .select("*")
    .eq("company_id", ctx!.effectiveCompanyId!)
    .is("deleted_at", null)
    .order("full_name");

  return (
    <div>
      <PageHeader
        title="Drivers"
        action={
          <Button asChild variant="outline">
            <Link href="/dashboard/drivers/new">Add driver</Link>
          </Button>
        }
      />
      {!drivers?.length ? (
        <EmptyState
          title="No drivers"
          description="Add drivers to assign trips and track availability."
          action={
            <Button asChild variant="outline">
              <Link href="/dashboard/drivers/new">Add driver</Link>
            </Button>
          }
        />
      ) : (
        <SectionPanel title="Driver roster" contentClassName="p-0">
          <DataTableShell>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>DL expiry</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {drivers.map((d) => {
                  const days = daysUntil(d.license_expiry_date);
                  const variant = expiryBadgeVariant(days);
                  return (
                    <TableRow key={d.id}>
                      <TableCell>
                        <Link
                          href={`/dashboard/drivers/${d.id}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {d.full_name}
                        </Link>
                      </TableCell>
                      <TableCell>{d.phone ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{d.availability_status}</Badge>
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "tabular-nums",
                            variant === "danger" && "font-medium text-destructive",
                            variant === "warning" && "text-orange-600"
                          )}
                        >
                          {formatDateIN(d.license_expiry_date)}
                          {days !== null && days <= 30 && ` (${days}d)`}
                        </span>
                      </TableCell>
                      <TableCell>
                        <RowActions 
                          editModalTitle="Edit Driver"
                          editContent={<DriverForm initialData={d} />}
                          onDelete={softDeleteDriver.bind(null, d.id)}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </DataTableShell>
        </SectionPanel>
      )}
    </div>
  );
}
