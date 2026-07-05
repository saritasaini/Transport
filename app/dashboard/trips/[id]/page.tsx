import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth/session";
import { PageHeader } from "@/components/shared/page-header";
import { TripStatusBadge } from "@/components/shared/status-badge";
import { SectionPanel } from "@/components/shared/section-panel";
import { DataTableShell } from "@/components/shared/data-table-shell";
import { EmptyState } from "@/components/shared/empty-state";
import { formatCurrencyINR, formatDateIN } from "@/lib/utils/format";
import type { TripStatus } from "@/types/database";
import { TripStatusActions } from "@/components/trips/trip-status-actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function TripDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await getSessionContext();
  const supabase = await createClient();

  const { data: trip } = await supabase
    .from("trips")
    .select(
      "*, customer:customers_parties(*), driver:drivers(*), vehicle:vehicles(*)"
    )
    .eq("id", id)
    .single();

  if (!trip) notFound();

  const [{ data: history }, { data: expenses }, { data: payments }] =
    await Promise.all([
      supabase
        .from("trip_status_history")
        .select("*")
        .eq("trip_id", id)
        .order("created_at", { ascending: true }),
      supabase
        .from("trip_expenses")
        .select("*")
        .eq("trip_id", id)
        .is("deleted_at", null),
      supabase
        .from("payments")
        .select("*")
        .eq("trip_id", id)
        .is("deleted_at", null),
    ]);

  const expenseRows = expenses ?? [];
  const paymentRows = payments ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={trip.trip_number}
        description={`${trip.origin} → ${trip.destination}`}
        action={<TripStatusBadge status={trip.status as TripStatus} />}
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <SectionPanel title="Trip details" className="lg:col-span-2">
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-2xs font-semibold uppercase tracking-wide text-muted-foreground">Customer</dt>
              <dd className="mt-0.5 font-medium">{trip.customer?.name}</dd>
            </div>
            <div>
              <dt className="text-2xs font-semibold uppercase tracking-wide text-muted-foreground">Date</dt>
              <dd className="mt-0.5 tabular-nums">{formatDateIN(trip.trip_date)}</dd>
            </div>
            <div>
              <dt className="text-2xs font-semibold uppercase tracking-wide text-muted-foreground">Driver</dt>
              <dd className="mt-0.5">{trip.driver?.full_name ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-2xs font-semibold uppercase tracking-wide text-muted-foreground">Vehicle</dt>
              <dd className="mt-0.5">{trip.vehicle?.registration_number ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-2xs font-semibold uppercase tracking-wide text-muted-foreground">Start location</dt>
              <dd className="mt-0.5">{trip.start_location}</dd>
            </div>
            <div>
              <dt className="text-2xs font-semibold uppercase tracking-wide text-muted-foreground">Fleet origin</dt>
              <dd className="mt-0.5">{trip.fleet_origin}</dd>
            </div>
            <div>
              <dt className="text-2xs font-semibold uppercase tracking-wide text-muted-foreground">Odometer</dt>
              <dd className="mt-0.5 tabular-nums">
                {trip.odometer_start ?? "—"} → {trip.odometer_end ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-2xs font-semibold uppercase tracking-wide text-muted-foreground">Distance</dt>
              <dd className="mt-0.5 tabular-nums">{trip.distance_covered ?? "—"} km</dd>
            </div>
            <div>
              <dt className="text-2xs font-semibold uppercase tracking-wide text-muted-foreground">Bill</dt>
              <dd className="mt-0.5 tabular-nums font-semibold">{formatCurrencyINR(trip.bill_amount)}</dd>
            </div>
            <div>
              <dt className="text-2xs font-semibold uppercase tracking-wide text-muted-foreground">Payment</dt>
              <dd className="mt-0.5 capitalize">{trip.payment_status}</dd>
            </div>
          </dl>
        </SectionPanel>
        <SectionPanel title="Update status">
          <TripStatusActions
            tripId={id}
            status={trip.status as TripStatus}
            isLocked={trip.is_locked}
            role={ctx?.role ?? "dispatcher"}
          />
        </SectionPanel>
      </div>
      <SectionPanel title="Status timeline">
        {(history ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">No status changes recorded.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {(history ?? []).map((h) => (
              <li key={h.id} className="flex flex-wrap gap-x-2">
                <span className="text-muted-foreground">{h.from_status ?? "—"} →</span>
                <span className="font-medium">{h.to_status}</span>
                <span className="text-muted-foreground">· {formatDateIN(h.created_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </SectionPanel>
      <div className="grid gap-6 lg:grid-cols-2">
        <SectionPanel title="Expenses" contentClassName="p-0">
          {expenseRows.length === 0 ? (
            <EmptyState title="No expenses" compact className="rounded-none border-0" />
          ) : (
            <DataTableShell>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenseRows.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell>{e.category}</TableCell>
                      <TableCell className="tabular-nums">{formatCurrencyINR(e.amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </DataTableShell>
          )}
        </SectionPanel>
        <SectionPanel title="Payments" contentClassName="p-0">
          {paymentRows.length === 0 ? (
            <EmptyState title="No payments" compact className="rounded-none border-0" />
          ) : (
            <DataTableShell>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paymentRows.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="tabular-nums">{formatDateIN(p.payment_date)}</TableCell>
                      <TableCell className="tabular-nums">{formatCurrencyINR(p.amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </DataTableShell>
          )}
        </SectionPanel>
      </div>
    </div>
  );
}
