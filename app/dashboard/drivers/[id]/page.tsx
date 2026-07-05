import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { SectionPanel } from "@/components/shared/section-panel";
import { EmptyState } from "@/components/shared/empty-state";
import { DataTableShell } from "@/components/shared/data-table-shell";
import { formatDateIN } from "@/lib/utils/format";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function DriverDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: driver } = await supabase.from("drivers").select("*").eq("id", id).single();
  if (!driver) notFound();

  const { data: trips } = await supabase
    .from("trips")
    .select("trip_number, status, trip_date")
    .eq("driver_id", id)
    .is("deleted_at", null)
    .order("trip_date", { ascending: false })
    .limit(20);

  const tripRows = trips ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title={driver.full_name} />
      <SectionPanel title="Profile">
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-2xs font-semibold uppercase tracking-wide text-muted-foreground">Phone</dt>
            <dd className="mt-0.5">{driver.phone ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-2xs font-semibold uppercase tracking-wide text-muted-foreground">License</dt>
            <dd className="mt-0.5">{driver.license_number ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-2xs font-semibold uppercase tracking-wide text-muted-foreground">DL expiry</dt>
            <dd className="mt-0.5 tabular-nums">{formatDateIN(driver.license_expiry_date)}</dd>
          </div>
          <div>
            <dt className="text-2xs font-semibold uppercase tracking-wide text-muted-foreground">Status</dt>
            <dd className="mt-0.5 capitalize">{driver.availability_status}</dd>
          </div>
        </dl>
      </SectionPanel>
      <SectionPanel title="Trip history" contentClassName="p-0">
        {tripRows.length === 0 ? (
          <EmptyState title="No trips" description="This driver has no trip history yet." compact className="rounded-none border-0" />
        ) : (
          <DataTableShell>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Trip</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tripRows.map((t) => (
                  <TableRow key={t.trip_number}>
                    <TableCell className="font-medium">{t.trip_number}</TableCell>
                    <TableCell className="capitalize">{t.status}</TableCell>
                    <TableCell className="tabular-nums">{formatDateIN(t.trip_date)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </DataTableShell>
        )}
      </SectionPanel>
    </div>
  );
}
