import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth/session";
import { PageHeader } from "@/components/shared/page-header";
import { TripStatusBadge } from "@/components/shared/status-badge";
import { SectionPanel } from "@/components/shared/section-panel";
import { DataTableShell } from "@/components/shared/data-table-shell";
import { EmptyState } from "@/components/shared/empty-state";
import { formatCurrencyINR, formatDateIN } from "@/lib/utils/format";
import { cn } from "@/lib/utils";
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

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";

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
        action={
          <div className="flex items-center gap-3">
            <TripStatusBadge status={trip.status as TripStatus} />
            <Button variant="outline" size="sm" asChild>
              <Link href={`/dashboard/trips/${id}/invoice`}>
                <FileText className="mr-2 h-4 w-4" />
                View Invoice
              </Link>
            </Button>
          </div>
        }
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
              <dt className="text-2xs font-semibold uppercase tracking-wide text-muted-foreground">E-Way Bill</dt>
              <dd className="mt-0.5 font-mono text-sm">{trip.eway_bill_no ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-2xs font-semibold uppercase tracking-wide text-muted-foreground">LR Number</dt>
              <dd className="mt-0.5 font-mono text-sm">{trip.lr_number ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-2xs font-semibold uppercase tracking-wide text-muted-foreground">POD Status</dt>
              <dd className="mt-0.5">
                {trip.pod_received ? (
                  <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                    Received
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-yellow-50 px-2 py-0.5 text-xs font-medium text-yellow-800 ring-1 ring-inset ring-yellow-600/20">
                    Pending
                  </span>
                )}
              </dd>
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
      <div className="grid gap-6 lg:grid-cols-4 mb-6">
        <SectionPanel title="Financial P&L" className="lg:col-span-1 bg-slate-50 border-blue-100">
          <div className="flex flex-col gap-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Income (Freight)</div>
              <div className="text-lg font-bold text-slate-900">{formatCurrencyINR(trip.freight_amount ?? trip.bill_amount)}</div>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Total Expenses</div>
              <div className="text-lg font-bold text-red-600">
                - {formatCurrencyINR(expenseRows.reduce((acc, e) => acc + Number(e.amount), 0))}
              </div>
            </div>
            <div className="pt-3 border-t border-slate-200">
              <div className="text-xs font-bold uppercase tracking-wide text-slate-700 mb-1">Net Profit</div>
              <div className={cn(
                "text-2xl font-black",
                (trip.freight_amount ?? trip.bill_amount) - expenseRows.reduce((acc, e) => acc + Number(e.amount), 0) >= 0 
                  ? "text-green-600" 
                  : "text-red-600"
              )}>
                {formatCurrencyINR((trip.freight_amount ?? trip.bill_amount) - expenseRows.reduce((acc, e) => acc + Number(e.amount), 0))}
              </div>
            </div>
          </div>
        </SectionPanel>
        
        <SectionPanel title="Status timeline" className="lg:col-span-3">
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
      </div>
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
                    <TableHead>Total Amount</TableHead>
                    <TableHead>Net Received</TableHead>
                    <TableHead>TDS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paymentRows.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="tabular-nums">{formatDateIN(p.payment_date)}</TableCell>
                      <TableCell className="tabular-nums font-semibold">{formatCurrencyINR(p.amount)}</TableCell>
                      <TableCell className="tabular-nums text-green-600 font-medium">
                        {formatCurrencyINR(p.net_received ?? p.amount)}
                      </TableCell>
                      <TableCell className="tabular-nums text-red-500">
                        {p.tds_deducted ? formatCurrencyINR(p.tds_deducted) : "—"}
                      </TableCell>
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
