import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth/session";
import { PageHeader } from "@/components/shared/page-header";
import { SectionPanel } from "@/components/shared/section-panel";
import { TripForm } from "@/components/trips/trip-form";

export default async function NewTripPage() {
  const ctx = await getSessionContext();
  const supabase = await createClient();
  const companyId = ctx!.effectiveCompanyId!;

  const [customers, vehicles, drivers, branches] = await Promise.all([
    supabase
      .from("customers_parties")
      .select("id, name")
      .eq("company_id", companyId!)
      .eq("type", "customer")
      .is("deleted_at", null),
    supabase
      .from("vehicles")
      .select("id, registration_number")
      .eq("company_id", companyId!)
      .eq("current_status", "available")
      .is("deleted_at", null),
    supabase
      .from("drivers")
      .select("id, full_name")
      .eq("company_id", companyId!)
      .eq("availability_status", "available")
      .eq("is_active", true)
      .is("deleted_at", null),
    supabase.from("branches").select("id, name").eq("company_id", companyId!),
  ]);

  const toOpt = (rows: { id: string; name?: string; full_name?: string; registration_number?: string }[]) =>
    (rows ?? []).map((r) => ({
      id: r.id,
      label: r.name ?? r.full_name ?? r.registration_number ?? r.id,
    }));

  return (
    <div>
      <PageHeader title="Create trip" description="Assign customer, vehicle, and driver" />
      <SectionPanel title="Trip details" contentClassName="p-4">
        <div className="max-w-2xl">
          <TripForm
            customers={toOpt(customers.data ?? [])}
            vehicles={toOpt(vehicles.data ?? [])}
            drivers={toOpt(drivers.data ?? [])}
            branches={toOpt(branches.data ?? [])}
          />
        </div>
      </SectionPanel>
    </div>
  );
}
