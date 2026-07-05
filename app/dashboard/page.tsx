import Link from "next/link";
import { getSessionContext } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { SectionPanel } from "@/components/shared/section-panel";
import { EmptyState } from "@/components/shared/empty-state";
import { KpiStrip } from "@/components/shared/kpi-strip";
import { formatCurrencyINR, formatDateIN } from "@/lib/utils/format";
import { FleetUtilizationChart } from "@/components/charts/fleet-utilization";
import { RecentTripsTable } from "@/components/tables/recent-trips";
import { FileWarning, ShieldCheck, Truck, Clock, CheckCircle2, Navigation, User, Wallet, FileText } from "lucide-react";

type ExpiryVehicle = {
  registration_number: string;
  insurance_expiry: string | null;
  fitness_expiry: string | null;
  permit_expiry: string | null;
};

function getExpiryItems(v: ExpiryVehicle, cutoff: string) {
  const items: { label: string; date: string }[] = [];
  if (v.insurance_expiry && v.insurance_expiry <= cutoff) {
    items.push({ label: "Insurance", date: v.insurance_expiry });
  }
  if (v.fitness_expiry && v.fitness_expiry <= cutoff) {
    items.push({ label: "Fitness", date: v.fitness_expiry });
  }
  if (v.permit_expiry && v.permit_expiry <= cutoff) {
    items.push({ label: "Permit", date: v.permit_expiry });
  }
  return items;
}

export default async function DashboardPage() {
  const ctx = await getSessionContext();
  const supabase = await createClient();
  const companyId = ctx!.effectiveCompanyId!;

  const today = new Date().toISOString().slice(0, 10);
  const monthStart = new Date();
  monthStart.setDate(1);
  const monthStartStr = monthStart.toISOString().slice(0, 10);

  const [
    { count: activeTrips },
    { count: pendingTrips },
    { count: completedToday },
    { count: vehiclesOnRoad },
    { count: availableDrivers },
    { data: trips },
    { data: vehicles },
    { data: expenses },
    { data: payments },
    { data: expiringVehicles },
  ] = await Promise.all([
    supabase
      .from("trips")
      .select("*", { count: "exact", head: true })
      .eq("company_id", companyId)
      .in("status", ["assigned", "in_transit"])
      .is("deleted_at", null),
    supabase
      .from("trips")
      .select("*", { count: "exact", head: true })
      .eq("company_id", companyId)
      .eq("status", "pending")
      .is("deleted_at", null),
    supabase
      .from("trips")
      .select("*", { count: "exact", head: true })
      .eq("company_id", companyId)
      .eq("status", "completed")
      .eq("trip_date", today)
      .is("deleted_at", null),
    supabase
      .from("vehicles")
      .select("*", { count: "exact", head: true })
      .eq("company_id", companyId)
      .eq("current_status", "on_trip"),
    supabase
      .from("drivers")
      .select("*", { count: "exact", head: true })
      .eq("company_id", companyId)
      .eq("availability_status", "available")
      .eq("is_active", true),
    supabase
      .from("trips")
      .select("*, customer:customers_parties(name)")
      .eq("company_id", companyId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase.from("vehicles").select("current_status").eq("company_id", companyId),
    supabase
      .from("trip_expenses")
      .select("amount")
      .eq("company_id", companyId)
      .gte("expense_date", monthStartStr)
      .is("deleted_at", null),
    supabase
      .from("payments")
      .select("amount")
      .eq("company_id", companyId)
      .gte("payment_date", monthStartStr)
      .is("deleted_at", null),
    supabase
      .from("vehicles")
      .select("registration_number, insurance_expiry, fitness_expiry, permit_expiry")
      .eq("company_id", companyId)
      .is("deleted_at", null),
  ]);

  const monthlyExpenses = expenses?.reduce((s, e) => s + Number(e.amount), 0) ?? 0;
  const monthlyIncome = payments?.reduce((s, p) => s + Number(p.amount), 0) ?? 0;

  const { data: unpaidTrips } = await supabase
    .from("trips")
    .select("bill_amount")
    .eq("company_id", companyId)
    .in("payment_status", ["unpaid", "partially_paid"])
    .is("deleted_at", null);

  const outstanding =
    unpaidTrips?.reduce((s, t) => s + Number(t.bill_amount), 0) ?? 0;

  const in7 = new Date();
  in7.setDate(in7.getDate() + 7);
  const cutoff = in7.toISOString().slice(0, 10);
  const expiryAlerts =
    expiringVehicles?.filter(
      (v) =>
        (v.insurance_expiry && v.insurance_expiry <= cutoff) ||
        (v.fitness_expiry && v.fitness_expiry <= cutoff) ||
        (v.permit_expiry && v.permit_expiry <= cutoff)
    ) ?? [];

  const kpis = [
    { label: "Active trips", value: activeTrips ?? 0 },
    { label: "Pending", value: pendingTrips ?? 0 },
    { label: "Completed today", value: completedToday ?? 0 },
    { label: "On road", value: vehiclesOnRoad ?? 0 },
    { label: "Drivers free", value: availableDrivers ?? 0 },
    {
      label: "Month in / out",
      value: formatCurrencyINR(monthlyIncome),
      hint: `Expenses ${formatCurrencyINR(monthlyExpenses)}`,
    },
    {
      label: "Outstanding",
      value: formatCurrencyINR(outstanding),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Fleet operations overview" />
      <KpiStrip items={kpis} className="lg:grid-cols-7" />
      <div className="grid gap-6 lg:grid-cols-2">
        <SectionPanel title="Fleet utilization">
          <FleetUtilizationChart vehicles={vehicles ?? []} />
        </SectionPanel>
        <SectionPanel title="Document expiry (7 days)">
          {expiryAlerts.length === 0 ? (
            <EmptyState
              icon={ShieldCheck}
              title="All documents current"
              description="No insurance, fitness, or permit expiries in the next 7 days."
              compact
              className="rounded-none border-0 bg-transparent"
            />
          ) : (
            <ul className="divide-y divide-border/60">
              {expiryAlerts.map((v) => {
                const items = getExpiryItems(v, cutoff);
                return (
                  <li
                    key={v.registration_number}
                    className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <span className="font-medium">{v.registration_number}</span>
                    <div className="flex flex-wrap gap-2">
                      {items.map((item) => (
                        <span
                          key={item.label}
                          className="inline-flex items-center gap-1 rounded-md bg-destructive/10 px-2 py-0.5 text-2xs font-medium text-destructive"
                        >
                          <FileWarning className="h-3 w-3" aria-hidden />
                          {item.label} · {formatDateIN(item.date)}
                        </span>
                      ))}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </SectionPanel>
      </div>
      <SectionPanel
        title="Recent trips"
        action={
          <Link
            href="/dashboard/trips"
            className="text-sm font-medium text-primary hover:underline"
          >
            View all
          </Link>
        }
        contentClassName="p-0"
      >
        <RecentTripsTable trips={trips ?? []} />
      </SectionPanel>
    </div>
  );
}
