import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth/session";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { SectionPanel } from "@/components/shared/section-panel";
import { DataTableShell } from "@/components/shared/data-table-shell";
import { ExpenseChart } from "@/components/charts/expense-chart";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrencyINR, formatDateIN } from "@/lib/utils/format";
import { Receipt } from "lucide-react";

export default async function ExpensesPage() {
  const ctx = await getSessionContext();
  const supabase = await createClient();
  const { data: expenses } = await supabase
    .from("trip_expenses")
    .select("*, trip:trips(trip_number)")
    .eq("company_id", ctx!.effectiveCompanyId!)
    .is("deleted_at", null)
    .order("expense_date", { ascending: false })
    .limit(100);

  const rows = expenses ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Expenses" description="All trip-linked expenses" />
      <SectionPanel title="By category" contentClassName="p-0">
        <ExpenseChart expenses={rows} />
      </SectionPanel>
      {!rows.length ? (
        <EmptyState
          icon={Receipt}
          title="No expenses recorded"
          description="Trip expenses will appear here once logged against active trips."
        />
      ) : (
        <SectionPanel title="Expense ledger" contentClassName="p-0">
          <DataTableShell>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Trip</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell>{e.trip?.trip_number}</TableCell>
                    <TableCell>{e.category}</TableCell>
                    <TableCell className="tabular-nums">
                      {formatDateIN(e.expense_date)}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {formatCurrencyINR(e.amount)}
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
