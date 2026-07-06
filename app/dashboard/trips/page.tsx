import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth/session";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { TripStatusBadge } from "@/components/shared/status-badge";
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
import { formatCurrencyINR, formatDateIN } from "@/lib/utils/format";
import type { TripStatus } from "@/types/database";
import { TripsFilters } from "@/components/trips/trips-filters";
import { RowActions } from "@/components/shared/row-actions";
import { deleteTrip } from "@/actions/trips";
import { TripForm } from "@/components/trips/trip-form";

export default async function TripsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const ctx = await getSessionContext();
  const params = await searchParams;
  const supabase = await createClient();
  const companyId = ctx!.effectiveCompanyId!;

  const [customers, vehicles, drivers, branches] = await Promise.all([
    supabase
      .from("customers_parties")
      .select("id, name")
      .eq("company_id", companyId)
      .eq("type", "customer")
      .is("deleted_at", null),
    supabase
      .from("vehicles")
      .select("id, registration_number")
      .eq("company_id", companyId)
      .eq("current_status", "available")
      .is("deleted_at", null),
    supabase
      .from("drivers")
      .select("id, full_name")
      .eq("company_id", companyId)
      .eq("availability_status", "available")
      .eq("is_active", true)
      .is("deleted_at", null),
    supabase.from("branches").select("id, name").eq("company_id", companyId),
  ]);

  const toOpt = (rows: any[]) =>
    (rows ?? []).map((r) => ({
      id: r.id,
      label: r.name ?? r.full_name ?? r.registration_number ?? r.id,
    }));

  const customerOpts = toOpt(customers.data ?? []);
  const vehicleOpts = toOpt(vehicles.data ?? []);
  const driverOpts = toOpt(drivers.data ?? []);
  const branchOpts = toOpt(branches.data ?? []);

  let query = supabase
    .from("trips")
    .select(
      "*, customer:customers_parties(name), driver:drivers(full_name), vehicle:vehicles(registration_number)"
    )
    .is("deleted_at", null)
    .order("trip_date", { ascending: false });

  if (ctx?.effectiveCompanyId) query = query.eq("company_id", ctx.effectiveCompanyId);
  if (params.status) query = query.eq("status", params.status);
  if (params.vehicle_id) query = query.eq("vehicle_id", params.vehicle_id);
  if (params.driver_id) query = query.eq("driver_id", params.driver_id);
  if (params.customer_id) query = query.eq("customer_id", params.customer_id);
  if (params.from) query = query.gte("trip_date", params.from);
  if (params.to) query = query.lte("trip_date", params.to);

  const { data: trips } = await query.limit(100);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Trips"
        description="Manage trip lifecycle and assignments"
        action={
          <Button asChild>
            <Link href="/dashboard/trips/new">Create trip</Link>
          </Button>
        }
      />
      <TripsFilters />
      {!trips?.length ? (
        <EmptyState
          title="No trips"
          description="Create your first trip to get started."
          action={
            <Button asChild>
              <Link href="/dashboard/trips/new">Create trip</Link>
            </Button>
          }
        />
      ) : (
        <SectionPanel title="All trips" contentClassName="p-0">
          <DataTableShell>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Trip #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Bill</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trips.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>
                      <Link
                        href={`/dashboard/trips/${t.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {t.trip_number}
                      </Link>
                    </TableCell>
                    <TableCell>{t.customer?.name}</TableCell>
                    <TableCell>{t.driver?.full_name ?? "—"}</TableCell>
                    <TableCell>{t.vehicle?.registration_number ?? "—"}</TableCell>
                    <TableCell className="tabular-nums">
                      {formatDateIN(t.trip_date)}
                    </TableCell>
                    <TableCell>
                      <TripStatusBadge status={t.status as TripStatus} />
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {formatCurrencyINR(t.bill_amount)}
                    </TableCell>
                    <TableCell>
                      <RowActions 
                        editModalTitle="Edit Trip"
                        editContent={
                          <TripForm 
                            initialData={t}
                            customers={customerOpts}
                            vehicles={vehicleOpts}
                            drivers={driverOpts}
                            branches={branchOpts}
                          />
                        }
                        onDelete={deleteTrip.bind(null, t.id)}
                      />
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
