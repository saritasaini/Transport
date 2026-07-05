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
import { formatCurrencyINR, formatDateIN } from "@/lib/utils/format";
import Link from "next/link";
import { CreditCard } from "lucide-react";

export default async function PaymentsPage() {
  const ctx = await getSessionContext();
  const supabase = await createClient();
  const { data: trips } = await supabase
    .from("trips")
    .select("*, customer:customers_parties(name)")
    .eq("company_id", ctx!.effectiveCompanyId!)
    .is("deleted_at", null)
    .order("trip_date", { ascending: false })
    .limit(100);

  const rows = trips ?? [];

  return (
    <div>
      <PageHeader
        title="Payments & Bill Settlement"
        description="Track bill amounts and payment status per trip"
      />
      {!rows.length ? (
        <EmptyState
          icon={CreditCard}
          title="No payment records"
          description="Trips with bill amounts will appear here for settlement tracking."
        />
      ) : (
        <SectionPanel title="Outstanding and settled bills" contentClassName="p-0">
          <DataTableShell>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Trip</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Bill</TableHead>
                  <TableHead>Payment status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((t) => (
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
                    <TableCell className="tabular-nums">
                      {formatCurrencyINR(t.bill_amount)}
                    </TableCell>
                    <TableCell className="capitalize">{t.payment_status}</TableCell>
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
