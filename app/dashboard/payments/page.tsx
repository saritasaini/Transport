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
import { CreditCard, History, HandCoins } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RowActions } from "@/components/shared/row-actions";
import { deletePayment } from "@/actions/finance";
import { PaymentForm } from "@/components/payments/payment-form";
import { Button } from "@/components/ui/button";

export default async function PaymentsPage() {
  const ctx = await getSessionContext();
  const supabase = await createClient();
  
  const { data: trips } = await supabase
    .from("trips")
    .select("*, customer:customers_parties(name)")
    .eq("company_id", ctx!.effectiveCompanyId!)
    .is("deleted_at", null)
    .neq("status", "cancelled")
    .order("trip_date", { ascending: false })
    .limit(100);

  const { data: payments } = await supabase
    .from("payments")
    .select("*, trip:trips(trip_number), customer:customers_parties(name)")
    .eq("company_id", ctx!.effectiveCompanyId!)
    .is("deleted_at", null)
    .order("payment_date", { ascending: false })
    .limit(100);

  const tripRows = trips ?? [];
  const paymentRows = payments ?? [];

  const tripOptions = tripRows.map(t => ({
    id: t.id,
    trip_number: t.trip_number,
    customer_id: t.customer_id
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments & Bill Settlement"
        description="Track bill amounts, outstanding balances, and payment history"
      />
      
      <Tabs defaultValue="outstanding" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="outstanding" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Outstanding Bills
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Payment History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="outstanding" className="space-y-4">
          {!tripRows.length ? (
            <EmptyState
              icon={CreditCard}
              title="No pending bills"
              description="Trips with bill amounts will appear here for settlement tracking."
            />
          ) : (
            <SectionPanel title="Trip Bills" contentClassName="p-0">
              <DataTableShell>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Trip</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Bill</TableHead>
                      <TableHead>Payment status</TableHead>
                      <TableHead className="w-[150px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tripRows.map((t) => (
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
                        <TableCell className="tabular-nums font-medium">
                          {formatCurrencyINR(t.bill_amount)}
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
                            t.payment_status === 'paid' ? "bg-green-50 text-green-700 ring-green-600/20" :
                            t.payment_status === 'partially_paid' ? "bg-blue-50 text-blue-700 ring-blue-600/20" :
                            "bg-yellow-50 text-yellow-800 ring-yellow-600/20"
                          }`}>
                            {t.payment_status.replace("_", " ").toUpperCase()}
                          </span>
                        </TableCell>
                        <TableCell>
                          {t.payment_status !== 'paid' && (
                            <RowActions 
                              editModalTitle="Record Payment"
                              editContent={<PaymentForm initialData={{ trip_id: t.id }} trips={tripOptions} />}
                              onDelete={undefined}
                              customTrigger={
                                <Button variant="outline" size="sm" className="h-8">
                                  <HandCoins className="w-4 h-4 mr-2" /> Pay
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
            </SectionPanel>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <div className="flex justify-end mb-4">
            <RowActions 
              editModalTitle="Record Payment"
              editContent={<PaymentForm trips={tripOptions} />}
              onDelete={undefined}
              customTrigger={
                <Button>
                  <HandCoins className="w-4 h-4 mr-2" /> Record Payment
                </Button>
              }
            />
          </div>
          {!paymentRows.length ? (
            <EmptyState
              icon={History}
              title="No payment history"
              description="Payments made will appear here."
            />
          ) : (
            <SectionPanel title="Payment Records" contentClassName="p-0">
              <DataTableShell>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Trip</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Mode</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paymentRows.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>{formatDateIN(p.payment_date)}</TableCell>
                        <TableCell>
                          <Link href={`/dashboard/trips/${p.trip_id}`} className="font-medium text-primary hover:underline">
                            {p.trip?.trip_number}
                          </Link>
                        </TableCell>
                        <TableCell>{p.customer?.name}</TableCell>
                        <TableCell className="capitalize">{p.payment_mode.replace("_", " ")}</TableCell>
                        <TableCell className="tabular-nums font-semibold text-green-600">
                          {formatCurrencyINR(p.amount)}
                        </TableCell>
                        <TableCell>
                          <RowActions 
                            editModalTitle="Edit Payment"
                            editContent={<PaymentForm initialData={p} trips={tripOptions} />}
                            onDelete={deletePayment.bind(null, p.id)}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </DataTableShell>
            </SectionPanel>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
