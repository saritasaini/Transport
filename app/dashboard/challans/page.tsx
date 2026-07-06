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
import { ShieldAlert, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrencyINR, formatDateIN } from "@/lib/utils/format";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { RowActions } from "@/components/shared/row-actions";
import { deleteChallan } from "@/actions/finance";
import { ChallanForm } from "@/components/challans/challan-form";

export default async function ChallansPage() {
  const ctx = await getSessionContext();
  const supabase = await createClient();
  
  const { data: challans, error } = await supabase
    .from("challans")
    .select("*, vehicle:vehicles(registration_number), driver:drivers(full_name)")
    .eq("company_id", ctx!.effectiveCompanyId!)
    .order("issue_date", { ascending: false });

  const { data: vehicles } = await supabase
    .from("vehicles")
    .select("id, registration_number")
    .eq("company_id", ctx!.effectiveCompanyId!)
    .is("deleted_at", null);

  const { data: drivers } = await supabase
    .from("drivers")
    .select("id, full_name")
    .eq("company_id", ctx!.effectiveCompanyId!)
    .is("deleted_at", null);

  const rows = challans ?? [];
  const vehicleOptions = vehicles ?? [];
  const driverOptions = drivers ?? [];
  const hasError = !!error;

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Traffic Challans" 
        description="Track and manage vehicle traffic fines and deductions" 
        action={
          <RowActions 
            editModalTitle="Add Traffic Challan"
            editContent={<ChallanForm vehicles={vehicleOptions} drivers={driverOptions} />}
            onDelete={undefined}
            customTrigger={
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Add Challan
              </Button>
            }
          />
        }
      />
      
      {hasError ? (
        <EmptyState
          icon={ShieldAlert}
          title="Database Update Required"
          description="Please run the phase 3 migration (007_phase3_challans_tds.sql) to view this page."
        />
      ) : !rows.length ? (
        <EmptyState
          icon={ShieldAlert}
          title="No challans found"
          description="Traffic fines and challans will appear here."
        />
      ) : (
        <SectionPanel title="All Challans" contentClassName="p-0">
          <DataTableShell>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Challan No</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Deduct</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.challan_no}</TableCell>
                    <TableCell>{formatDateIN(c.issue_date)}</TableCell>
                    <TableCell>{c.vehicle?.registration_number ?? "—"}</TableCell>
                    <TableCell>{c.driver?.full_name ?? "—"}</TableCell>
                    <TableCell className="font-semibold text-red-600">{formatCurrencyINR(c.amount)}</TableCell>
                    <TableCell>
                      <span className={cn(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
                        c.status === 'paid' ? "bg-green-50 text-green-700 ring-green-600/20" :
                        c.status === 'contested' ? "bg-blue-50 text-blue-700 ring-blue-600/20" :
                        "bg-yellow-50 text-yellow-800 ring-yellow-600/20"
                      )}>
                        {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                      </span>
                    </TableCell>
                    <TableCell>{c.deduct_from_driver ? "Yes" : "No"}</TableCell>
                    <TableCell>
                      <RowActions 
                        editModalTitle="Edit Challan"
                        editContent={<ChallanForm initialData={c} vehicles={vehicleOptions} drivers={driverOptions} />}
                        onDelete={deleteChallan.bind(null, c.id)}
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
  );
}
