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
import { formatCurrencyINR } from "@/lib/utils/format";
import Link from "next/link";
import { CreditCard, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { RowActions } from "@/components/shared/row-actions";
import { PaymentForm } from "@/components/payments/payment-form";

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const ctx = await getSessionContext();
  const supabase = await createClient();
  const params = await searchParams;
  
  // Currently we use trip_date + 30 days as a simple overdue check if due_date isn't available
  const { data: trips } = await supabase
    .from("trips")
    .select("*, customer:customers_parties(name), payments(amount)")
    .eq("company_id", ctx!.effectiveCompanyId!)
    .is("deleted_at", null)
    .neq("status", "cancelled")
    .order("trip_date", { ascending: false });

  const tripRows = trips ?? [];

  let totalBilled = 0;
  let totalCollected = 0;
  let totalOverdue = 0;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const processedTrips = tripRows.map(t => {
    const billAmt = Number(t.bill_amount ?? t.freight_amount ?? 0);
    const payments = t.payments as { amount: number }[];
    const collectedAmt = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const balanceDue = billAmt - collectedAmt;
    
    let status = "unpaid";
    if (balanceDue <= 0 && billAmt > 0) status = "paid";
    else if (collectedAmt > 0 && balanceDue > 0) status = "partial";

    totalBilled += billAmt;
    totalCollected += collectedAmt;

    const tripDate = new Date(t.trip_date);
    if (status !== "paid" && tripDate < thirtyDaysAgo) {
      totalOverdue += balanceDue;
    }

    return {
      ...t,
      billAmt,
      collectedAmt,
      balanceDue,
      derivedStatus: status,
    };
  });

  const totalOutstanding = totalBilled - totalCollected;

  const filterTab = params.tab || "all";
  const viewMode = params.view || "trip";

  const filteredTrips = processedTrips.filter(t => {
    if (filterTab === "unpaid") return t.derivedStatus === "unpaid";
    if (filterTab === "partial") return t.derivedStatus === "partial";
    if (filterTab === "paid") return t.derivedStatus === "paid";
    return true; // all
  });

  const tripOptions = tripRows.map(t => ({
    id: t.id,
    trip_number: t.trip_number,
    customer_id: t.customer_id
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments & bill settlement"
        description="Track bill amounts, collections and outstanding per trip"
      />
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
          <p className="text-sm text-slate-500 font-medium mb-1">Total billed</p>
          <p className="text-3xl font-bold text-slate-900">{formatCurrencyINR(totalBilled)}</p>
        </div>
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
          <p className="text-sm text-slate-500 font-medium mb-1">Collected</p>
          <p className="text-3xl font-bold text-emerald-600">{formatCurrencyINR(totalCollected)}</p>
        </div>
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
          <p className="text-sm text-slate-500 font-medium mb-1">Outstanding</p>
          <p className="text-3xl font-bold text-red-600">{formatCurrencyINR(totalOutstanding)}</p>
        </div>
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
          <p className="text-sm text-slate-500 font-medium mb-1">Overdue (&gt;30 days)</p>
          <p className="text-3xl font-bold text-amber-600">{formatCurrencyINR(totalOverdue)}</p>
        </div>
      </div>

      <SectionPanel title="Outstanding and settled bills" contentClassName="p-0">
        <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
           <div className="flex items-center gap-2">
             <Button variant={filterTab === "all" ? "default" : "outline"} size="sm" asChild>
                <Link href={`?tab=all&view=${viewMode}`}>All</Link>
             </Button>
             <Button variant={filterTab === "unpaid" ? "default" : "outline"} size="sm" asChild>
                <Link href={`?tab=unpaid&view=${viewMode}`}>Unpaid</Link>
             </Button>
             <Button variant={filterTab === "partial" ? "default" : "outline"} size="sm" asChild>
                <Link href={`?tab=partial&view=${viewMode}`}>Partial</Link>
             </Button>
             <Button variant={filterTab === "paid" ? "default" : "outline"} size="sm" asChild>
                <Link href={`?tab=paid&view=${viewMode}`}>Paid</Link>
             </Button>
           </div>
           
           <RowActions 
              editModalTitle="Record Payment"
              editContent={<PaymentForm trips={tripOptions} />}
              onDelete={undefined}
              customTrigger={
                <Button size="sm">
                  + Record payment
                </Button>
              }
            />
        </div>

        <div className="p-4 border-b border-slate-200 flex items-center gap-2">
          <Button variant={viewMode === "trip" ? "secondary" : "ghost"} size="sm" asChild>
            <Link href={`?tab=${filterTab}&view=trip`}>By trip</Link>
          </Button>
          <Button variant={viewMode === "customer" ? "secondary" : "ghost"} size="sm" asChild>
            <Link href={`?tab=${filterTab}&view=customer`}>By customer</Link>
          </Button>
        </div>

        {!filteredTrips.length ? (
          <EmptyState
            icon={CreditCard}
            title="No records found"
            description="No trips match the selected filters."
          />
        ) : viewMode === "trip" ? (
          <DataTableShell>
            <Table>
              <TableHeader>
                <TableRow className="text-xs uppercase text-slate-500 tracking-wider bg-slate-50/50">
                  <TableHead className="py-3">Trip</TableHead>
                  <TableHead className="py-3">Customer</TableHead>
                  <TableHead className="py-3">Route</TableHead>
                  <TableHead className="py-3 text-right">Bill Amount</TableHead>
                  <TableHead className="py-3 text-right">Collected</TableHead>
                  <TableHead className="py-3 text-right">Balance Due</TableHead>
                  <TableHead className="py-3 w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTrips.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="py-3">
                      <Link
                        href={`/dashboard/trips/${t.id}`}
                        className="font-medium text-brand-600 hover:underline block"
                      >
                        {t.trip_number}
                      </Link>
                    </TableCell>
                    <TableCell className="py-3 font-medium text-slate-900">{t.customer?.name ?? "N/A"}</TableCell>
                    <TableCell className="py-3">
                      <div className="flex items-center gap-1 text-sm text-slate-600 whitespace-nowrap">
                         {t.origin} <ArrowRight className="h-3 w-3 text-slate-400" /> {t.destination}
                      </div>
                    </TableCell>
                    <TableCell className="py-3 text-right font-medium text-slate-900">
                      {formatCurrencyINR(t.billAmt)}
                    </TableCell>
                    <TableCell className="py-3 text-right text-emerald-600 font-medium">
                      {t.collectedAmt > 0 ? formatCurrencyINR(t.collectedAmt) : "₹0"}
                    </TableCell>
                    <TableCell className={cn("py-3 text-right font-medium", t.balanceDue > 0 ? "text-red-600" : "text-slate-500")}>
                      {formatCurrencyINR(t.balanceDue)}
                    </TableCell>
                    <TableCell className="py-3 text-right">
                      {t.balanceDue > 0 && (
                        <RowActions 
                          editModalTitle={`Record Payment for ${t.trip_number}`}
                          editContent={<PaymentForm initialData={{ trip_id: t.id }} trips={tripOptions} />}
                          onDelete={undefined}
                          customTrigger={
                            <Button variant="outline" size="sm" className="h-8">
                              Collect
                            </Button>
                          }
                        />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </DataTableShell>
        ) : (
          <div className="p-8 text-center text-slate-500">
            Customer-wise grouped view will be implemented soon.
          </div>
        )}
      </SectionPanel>
    </div>
  );
}
