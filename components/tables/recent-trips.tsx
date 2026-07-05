import Link from "next/link";
import { TripStatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { DataTableShell } from "@/components/shared/data-table-shell";
import { formatDateIN } from "@/lib/utils/format";
import type { Trip, TripStatus } from "@/types/database";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Route } from "lucide-react";

export function RecentTripsTable({
  trips,
}: {
  trips: (Trip & { customer?: { name: string } })[];
}) {
  if (trips.length === 0) {
    return (
      <EmptyState
        icon={Route}
        title="No trips yet"
        description="Recent trips will appear here once created."
        compact
        className="rounded-none border-0"
      />
    );
  }

  return (
    <DataTableShell>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead scope="col">Trip</TableHead>
            <TableHead scope="col">Customer</TableHead>
            <TableHead scope="col">Date</TableHead>
            <TableHead scope="col">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {trips.map((t) => (
            <TableRow key={t.id}>
              <TableCell>
                <Link
                  href={`/dashboard/trips/${t.id}`}
                  className="font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
                >
                  {t.trip_number}
                </Link>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {t.customer?.name ?? "—"}
              </TableCell>
              <TableCell className="tabular-nums text-muted-foreground">
                {formatDateIN(t.trip_date)}
              </TableCell>
              <TableCell>
                <TripStatusBadge status={t.status as TripStatus} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </DataTableShell>
  );
}
