import Link from "next/link";
import { cn } from "@/lib/utils";
import { getSessionContext } from "@/lib/auth/session";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { SectionPanel } from "@/components/shared/section-panel";
import { EmptyState } from "@/components/shared/empty-state";
import { KpiStrip } from "@/components/shared/kpi-strip";
import { formatCurrencyINR, formatCurrencyCompactINR, formatDateIN } from "@/lib/utils/format";
import { FleetUtilizationChart } from "@/components/charts/fleet-utilization";
import { RecentTripsTable } from "@/components/tables/recent-trips";
import { FileWarning, ShieldCheck, Truck, Clock, CheckCircle2, Navigation, User, Wallet, FileText, Info, ChevronDown, ChevronRight, CheckSquare, Route, ArrowUpRight, Calendar, MoreVertical } from "lucide-react";
import { DashboardDatePicker } from "@/components/shared/dashboard-date-picker";

type ExpiryVehicle = {
  registration_number: string;
  insurance_expiry: string | null;
  fitness_expiry: string | null;
  permit_expiry: string | null;
};

function getExpiryItems(v: ExpiryVehicle, cutoff: string) {
  const todayStr = new Date().toISOString().slice(0, 10);
  const items: { label: string; date: string; status: 'expired' | 'expiring_soon' | 'valid' }[] = [];
  
  const checkExpiry = (label: string, date: string | null) => {
    if (!date) return;
    if (date < todayStr) {
      items.push({ label, date, status: 'expired' });
    } else if (date <= cutoff) {
      items.push({ label, date, status: 'expiring_soon' });
    } else {
      items.push({ label, date, status: 'valid' });
    }
  };

  checkExpiry("Insurance", v.insurance_expiry);
  checkExpiry("Fitness", v.fitness_expiry);
  checkExpiry("Permit", v.permit_expiry);
  
  return items;
}

const RoadIcon = ({ className, strokeWidth = 2, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="m6 22 4-16" />
    <path d="m18 22-4-16" />
    <path d="M12 22v-3" />
    <path d="M12 15v-3" />
    <path d="M12 8v-2" />
  </svg>
);

import { ExpenseUploadForm } from "@/components/driver/expense-upload-form";
import { PodUploadForm } from "@/components/driver/pod-upload-form";
import { MapPin } from "lucide-react";

export default async function DashboardPage() {
  const ctx = await getSessionContext();
  const supabase = await createClient();
  const companyId = ctx!.effectiveCompanyId!;

  // DRIVER MOBILE VIEW
  if (ctx?.role === "driver") {
    // Find the active trip for this driver (assigned or in_transit)
    // NOTE: In a real app we'd map user_id -> driver_id. For demo, we just get their latest active trip
    const { data: activeTrip } = await supabase
      .from("trips")
      .select("*, vehicle:vehicles(registration_number)")
      .eq("company_id", companyId)
      .in("status", ["assigned", "in_transit"])
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    return (
      <div className="space-y-6 max-w-md mx-auto pb-20">
        <PageHeader 
          title="Driver Portal" 
          description="Manage your active trips and expenses" 
        />
        
        {!activeTrip ? (
          <EmptyState
            icon={Truck}
            title="No Active Trip"
            description="You don't have any trips assigned currently."
            className="mt-6"
          />
        ) : (
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm ring-1 ring-slate-200 overflow-hidden">
              <div className="bg-blue-600 px-4 py-3 text-white flex justify-between items-center">
                <span className="font-bold">{activeTrip.trip_number}</span>
                <span className="px-2 py-1 bg-white/20 rounded-full text-xs font-medium backdrop-blur-sm uppercase">
                  {activeTrip.status.replace("_", " ")}
                </span>
              </div>
              <div className="p-4 space-y-4">
                <div className="flex gap-3">
                  <div className="flex flex-col items-center gap-1 mt-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-300 ring-2 ring-white"></div>
                    <div className="w-0.5 h-6 bg-slate-200"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500 ring-2 ring-white"></div>
                  </div>
                  <div className="flex-1 space-y-3">
                    <div>
                      <div className="text-xs text-slate-500 font-medium">Origin</div>
                      <div className="font-semibold text-slate-900">{activeTrip.origin}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 font-medium">Destination</div>
                      <div className="font-semibold text-slate-900">{activeTrip.destination}</div>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                  <div>
                    <div className="text-xs text-slate-500">Vehicle</div>
                    <div className="font-medium">{activeTrip.vehicle?.registration_number ?? "—"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Date</div>
                    <div className="font-medium">{formatDateIN(activeTrip.trip_date)}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-6">
              <ExpenseUploadForm tripId={activeTrip.id} />
              <Button className="w-full flex items-center gap-2" variant="outline">
                <MapPin className="w-4 h-4" />
                Navigate
              </Button>
            </div>
            
            <div className="pt-2">
              <PodUploadForm tripId={activeTrip.id} />
            </div>
          </div>
        )}
      </div>
    );
  }

  // ADMIN DESKTOP VIEW

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
    { data: unpaidTrips },
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
      .eq("company_id", companyId)
      .is("deleted_at", null),
    supabase
      .from("trips")
      .select("bill_amount")
      .eq("company_id", companyId)
      .in("payment_status", ["unpaid", "partially_paid"])
      .is("deleted_at", null),
  ]);

  const monthlyExpenses = expenses?.reduce((s, e) => s + Number(e.amount), 0) ?? 0;
  const monthlyIncome = payments?.reduce((s, p) => s + Number(p.amount), 0) ?? 0;

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
    { 
      label: "Active Trips", 
      value: activeTrips ?? 0, 
      icon: Truck, 
      iconColor: "blue" as const 
    },
    { 
      label: "Pending", 
      value: pendingTrips ?? 0, 
      icon: Clock, 
      iconColor: "orange" as const 
    },
    { 
      label: "Completed Today", 
      value: completedToday ?? 0, 
      icon: CheckSquare, 
      iconColor: "green" as const 
    },
    { 
      label: "On Road", 
      value: vehiclesOnRoad ?? 0, 
      icon: RoadIcon, 
      iconColor: "purple" as const 
    },
    { 
      label: "Drivers Free", 
      value: availableDrivers ?? 0, 
      icon: User, 
      iconColor: "cyan" as const,
      hint: (
        <span className="flex items-center justify-center gap-1 text-emerald-600">
          <ArrowUpRight className="h-3 w-3" strokeWidth={3} /> {availableDrivers} available
        </span>
      )
    },
    {
      label: "Month In / Out",
      value: formatCurrencyCompactINR(monthlyIncome),
      hint: `Expenses ${formatCurrencyCompactINR(monthlyExpenses)}`,
      icon: Wallet,
      iconColor: "blue" as const
    },
    {
      label: "Outstanding",
      value: formatCurrencyCompactINR(outstanding),
      icon: FileText,
      iconColor: "orange" as const
    },
  ];

  const currentDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Dashboard" 
        description="Fleet operations overview" 
        action={
          <div className="flex items-center gap-3">
            <DashboardDatePicker />
            <button className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 shadow-sm transition-colors text-slate-600">
              <MoreVertical className="h-5 w-5" />
            </button>
          </div>
        }
      />
      <KpiStrip items={kpis} />
      <div className="grid gap-6 lg:grid-cols-2">
        <SectionPanel 
          title={
            <div className="flex items-center gap-1.5">
              <span>Fleet utilization</span>
              <Info className="h-4 w-4 text-slate-400" />
            </div>
          }
          action={
            <div className="flex items-center gap-1 text-sm font-medium text-blue-600 cursor-pointer">
              This Month <ChevronDown className="h-4 w-4" />
            </div>
          }
        >
          <FleetUtilizationChart vehicles={vehicles ?? []} />
        </SectionPanel>
        <SectionPanel 
          title="Document expiry (7 days)"
          action={
            <Link
              href="/dashboard/vehicles"
              className="text-sm font-medium text-blue-600 hover:underline"
            >
              View all
            </Link>
          }
          contentClassName="p-4"
        >
          {expiryAlerts.length === 0 ? (
            <EmptyState
              icon={ShieldCheck}
              title="All documents current"
              description="No insurance, fitness, or permit expiries in the next 7 days."
              compact
              className="rounded-none border-0 bg-transparent"
            />
          ) : (
            <div className="flex flex-col h-full">
              <ul className="flex-1 divide-y divide-slate-100">
                {expiryAlerts.map((v, idx) => {
                  const items = getExpiryItems(v, cutoff);
                  
                  const bgColors = [
                    "bg-red-100 text-red-500",
                    "bg-blue-100 text-blue-500",
                    "bg-purple-100 text-purple-500",
                    "bg-emerald-100 text-emerald-500",
                  ];
                  const iconColor = bgColors[idx % bgColors.length];

                  return (
                    <li
                      key={v.registration_number}
                      className="flex items-center justify-between py-3.5 group hover:bg-slate-50 transition-colors -mx-4 px-4 cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn("h-10 w-10 shrink-0 rounded-xl flex items-center justify-center", iconColor)}>
                          <Truck className="h-5 w-5" />
                        </div>
                        <span className="font-bold text-slate-900 text-sm">{v.registration_number}</span>
                      </div>
                      
                      <div className="flex items-center gap-6">
                        <div className="flex items-center hidden sm:flex divide-x divide-slate-100">
                          {items.map((item) => {
                            const statusColor = 
                              item.status === 'expired' ? 'text-red-500' : 
                              item.status === 'expiring_soon' ? 'text-orange-500' : 
                              'text-emerald-500';

                            return (
                              <span
                                key={item.label}
                                className={cn("text-xs font-medium px-4 first:pl-0", statusColor)}
                              >
                                {item.label} • {formatDateIN(item.date)}
                              </span>
                            );
                          })}
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-slate-600 transition-colors ml-2" />
                      </div>
                    </li>
                  );
                })}
              </ul>
              
              <div className="flex items-center gap-6 mt-2 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                  <span className="text-xs font-medium text-slate-600">Expired</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                  <span className="text-xs font-medium text-slate-600">Expiring Soon</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <span className="text-xs font-medium text-slate-600">Valid</span>
                </div>
              </div>
            </div>
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
