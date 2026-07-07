import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth/session";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
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
import { EmptyState } from "@/components/shared/empty-state";
import { Download, ArrowRight, Receipt, FileSpreadsheet } from "lucide-react";
import { cn } from "@/lib/utils";
import { ExpenseChart } from "@/components/charts/expense-chart";
import { RowActions } from "@/components/shared/row-actions";
import { deleteExpense } from "@/actions/finance";
import { ExpenseForm } from "@/components/expenses/expense-form";

const formatMoney = (amount: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
};

export default async function JobSheetPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const ctx = await getSessionContext();
  const supabase = await createClient();
  const companyId = ctx!.effectiveCompanyId!;
  const params = await searchParams;
  const viewMode = params.view || "jobs"; // 'jobs' or 'expenses'

  // --- DATA FETCHING ---
  
  // Job Sheet Data
  let jobQuery = supabase
    .from("trips")
    .select(`
      *,
      customer:customers_parties(name),
      trip_expenses(category, amount)
    `)
    .eq("company_id", companyId)
    .is("deleted_at", null)
    .order("trip_date", { ascending: false });

  const period = params.period || "this_month";

  if (period === "this_month") {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const firstDay = `${y}-${m}-01`;
    jobQuery = jobQuery.gte("trip_date", firstDay);
  } else if (period === "last_month") {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth(); 
    const prevMonth = m === 0 ? 12 : m;
    const prevYear = m === 0 ? y - 1 : y;
    const strM = String(prevMonth).padStart(2, '0');
    const firstDay = `${prevYear}-${strM}-01`;
    const lastDayOfPrevMonth = new Date(prevYear, prevMonth, 0).getDate();
    const lastDay = `${prevYear}-${strM}-${lastDayOfPrevMonth}`;
    jobQuery = jobQuery.gte("trip_date", firstDay).lte("trip_date", lastDay);
  }

  // Expense Ledger Data
  const expenseQuery = supabase
    .from("trip_expenses")
    .select("*, trip:trips(trip_number)")
    .eq("company_id", companyId)
    .is("deleted_at", null)
    .order("expense_date", { ascending: false })
    .limit(100);

  const tripsListQuery = supabase
    .from("trips")
    .select("id, trip_number")
    .eq("company_id", companyId)
    .is("deleted_at", null)
    .order("trip_number", { ascending: false });

  const [
    { data: trips },
    { data: expenses },
    { data: tripsList }
  ] = await Promise.all([
    jobQuery.limit(100),
    viewMode === 'expenses' ? expenseQuery : Promise.resolve({ data: [] }),
    viewMode === 'expenses' ? tripsListQuery : Promise.resolve({ data: [] })
  ]);

  // --- JOB SHEET PROCESSING ---
  const processedTrips = (trips ?? []).map((t) => {
    let fuel = 0, driverPay = 0, tollMisc = 0, maintenance = 0;
    const tExpenses = (t.trip_expenses as any[]) || [];
    tExpenses.forEach((e) => {
      const amt = Number(e.amount);
      if (e.category === "fuel") fuel += amt;
      else if (e.category === "driver_allowance" || e.category === "food") driverPay += amt;
      else if (e.category === "maintenance") maintenance += amt;
      else tollMisc += amt;
    });

    const totalCost = fuel + driverPay + tollMisc + maintenance;
    const revenue = Number(t.freight_amount ?? t.bill_amount ?? 0);
    const netProfit = revenue - totalCost;
    const margin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

    return { ...t, fuel, driverPay, tollMisc, maintenance, totalCost, revenue, netProfit, margin };
  });

  const totalRevenue = processedTrips.reduce((acc, t) => acc + t.revenue, 0);
  const totalCosts = processedTrips.reduce((acc, t) => acc + t.totalCost, 0);
  const overallNetProfit = totalRevenue - totalCosts;
  const overallMargin = totalRevenue > 0 ? (overallNetProfit / totalRevenue) * 100 : 0;

  // --- EXPENSE PROCESSING ---
  const expenseRows = expenses ?? [];
  const activeTripsList = tripsList ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Job Sheet & Expenses"
        description="Revenue vs. cost breakdown, profitability per trip, and expense ledger"
        action={
          <div className="flex gap-2 items-center">
            {viewMode === "expenses" && (
              <Button asChild>
                <Link href="/dashboard/expenses/new">Add Expense</Link>
              </Button>
            )}
            <Button variant="outline" asChild>
              <a href={viewMode === "jobs" ? "/api/export/financial?format=xlsx" : "/api/export/expense?format=xlsx"} target="_blank" rel="noopener noreferrer">
                <Download className="h-4 w-4 mr-2" />
                Export
              </a>
            </Button>
          </div>
        }
      />

      <div className="flex border-b border-slate-200">
        <Link 
          href="?view=jobs" 
          className={cn(
            "px-4 py-2 border-b-2 text-sm font-medium flex items-center gap-2", 
            viewMode === "jobs" ? "border-brand-600 text-brand-600" : "border-transparent text-slate-500 hover:text-slate-700"
          )}
        >
          <FileSpreadsheet className="w-4 h-4" /> Trip Job Sheets
        </Link>
        <Link 
          href="?view=expenses" 
          className={cn(
            "px-4 py-2 border-b-2 text-sm font-medium flex items-center gap-2", 
            viewMode === "expenses" ? "border-brand-600 text-brand-600" : "border-transparent text-slate-500 hover:text-slate-700"
          )}
        >
          <Receipt className="w-4 h-4" /> All Expenses
        </Link>
      </div>

      {viewMode === "jobs" ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
              <p className="text-sm text-slate-500 font-medium mb-1">Total revenue ({processedTrips.length} trips)</p>
              <p className="text-3xl font-bold text-slate-900">{formatMoney(totalRevenue)}</p>
            </div>
            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
              <p className="text-sm text-slate-500 font-medium mb-1">Total costs</p>
              <p className="text-3xl font-bold text-red-600">{formatMoney(totalCosts)}</p>
            </div>
            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
              <p className="text-sm text-slate-500 font-medium mb-1">Net profit</p>
              <p className={cn("text-3xl font-bold", overallNetProfit >= 0 ? "text-emerald-600" : "text-red-600")}>
                {formatMoney(overallNetProfit)}
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
              <p className="text-sm text-slate-500 font-medium mb-1">Avg margin</p>
              <p className="text-3xl font-bold text-slate-900">{overallMargin.toFixed(1)}%</p>
            </div>
          </div>

          <SectionPanel title="All jobs — cost allocation" contentClassName="p-0">
            <div className="p-4 border-b border-slate-200 flex items-center justify-end gap-2">
               <Button variant={period === "all" ? "default" : "outline"} size="sm" asChild>
                 <Link href="?view=jobs&period=all">All</Link>
               </Button>
               <Button variant={period === "this_month" ? "default" : "outline"} size="sm" asChild>
                 <Link href="?view=jobs&period=this_month">This month</Link>
               </Button>
               <Button variant={period === "last_month" ? "default" : "outline"} size="sm" asChild>
                 <Link href="?view=jobs&period=last_month">Last month</Link>
               </Button>
            </div>
            {!processedTrips.length ? (
              <EmptyState title="No trips found" description="Create trips and add expenses to see cost allocations." />
            ) : (
              <DataTableShell>
                <Table>
                  <TableHeader>
                    <TableRow className="text-xs uppercase text-slate-500 tracking-wider bg-slate-50/50">
                      <TableHead className="py-3 whitespace-nowrap">Job / Trip</TableHead>
                      <TableHead className="py-3 whitespace-nowrap">Customer</TableHead>
                      <TableHead className="py-3">Route</TableHead>
                      <TableHead className="py-3 text-right whitespace-nowrap">Revenue</TableHead>
                      <TableHead className="py-3 text-right whitespace-nowrap">Fuel</TableHead>
                      <TableHead className="py-3 text-right whitespace-nowrap">Driver Pay</TableHead>
                      <TableHead className="py-3 text-right whitespace-nowrap">Toll / Misc</TableHead>
                      <TableHead className="py-3 text-right whitespace-nowrap">Total Cost</TableHead>
                      <TableHead className="py-3 text-right whitespace-nowrap">Net Profit</TableHead>
                      <TableHead className="py-3 text-right whitespace-nowrap">Margin</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {processedTrips.map((trip) => {
                      const customerName = (trip.customer as any)?.name ?? "N/A";
                      const isLoss = trip.netProfit < 0;
                      return (
                        <TableRow key={trip.id} className={cn(isLoss && "bg-red-50/50 hover:bg-red-50")}>
                          <TableCell className="py-3 whitespace-nowrap">
                            <Link href={`/dashboard/trips/${trip.id}`} className="text-brand-600 hover:underline font-medium block">
                              {trip.trip_number}
                            </Link>
                            <span className="text-xs text-slate-500">{formatDateIN(trip.trip_date)}</span>
                          </TableCell>
                          <TableCell className="py-3 font-medium text-slate-900 whitespace-nowrap max-w-[150px] truncate" title={customerName}>{customerName}</TableCell>
                          <TableCell className="py-3">
                            <div className="flex items-center gap-1.5 text-sm text-slate-600 whitespace-nowrap max-w-[200px] truncate" title={`${trip.origin} -> ${trip.destination}`}>
                               {trip.origin} <ArrowRight className="h-3 w-3 text-slate-400 shrink-0" /> {trip.destination}
                            </div>
                          </TableCell>
                          <TableCell className="py-3 text-right font-medium text-slate-900 whitespace-nowrap">{formatMoney(trip.revenue)}</TableCell>
                          <TableCell className="py-3 text-right text-slate-600 whitespace-nowrap">{formatMoney(trip.fuel)}</TableCell>
                          <TableCell className="py-3 text-right text-slate-600 whitespace-nowrap">{formatMoney(trip.driverPay)}</TableCell>
                          <TableCell className="py-3 text-right text-slate-600 whitespace-nowrap">{formatMoney(trip.tollMisc)}</TableCell>
                          <TableCell className="py-3 text-right font-medium text-slate-900 whitespace-nowrap">{formatMoney(trip.totalCost)}</TableCell>
                          <TableCell className={cn("py-3 text-right font-bold whitespace-nowrap", isLoss ? "text-red-600" : "text-emerald-600")}>
                            {formatMoney(trip.netProfit)}
                          </TableCell>
                          <TableCell className={cn("py-3 text-right font-medium whitespace-nowrap", isLoss ? "text-red-600" : "text-emerald-600")}>
                            {trip.margin.toFixed(1)}%
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </DataTableShell>
            )}
          </SectionPanel>
        </div>
      ) : (
        <div className="space-y-6">
          <SectionPanel title="By category" contentClassName="p-0">
            <ExpenseChart expenses={expenseRows} />
          </SectionPanel>
          {!expenseRows.length ? (
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
                    <TableRow className="bg-slate-50/50">
                      <TableHead>Trip</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenseRows.map((e) => (
                      <TableRow key={e.id}>
                        <TableCell>
                          <Link href={`/dashboard/trips/${e.trip_id}`} className="text-brand-600 hover:underline">
                            {e.trip?.trip_number}
                          </Link>
                        </TableCell>
                        <TableCell className="capitalize font-medium">{e.category.replace("_", " ")}</TableCell>
                        <TableCell className="tabular-nums text-slate-600">
                          {formatDateIN(e.expense_date)}
                        </TableCell>
                        <TableCell className="tabular-nums font-semibold">
                          {formatCurrencyINR(e.amount)}
                        </TableCell>
                        <TableCell>
                          <RowActions 
                            editModalTitle="Edit Expense"
                            editContent={<ExpenseForm initialData={e} trips={activeTripsList} />}
                            onDelete={deleteExpense.bind(null, e.id)}
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
      )}
    </div>
  );
}
