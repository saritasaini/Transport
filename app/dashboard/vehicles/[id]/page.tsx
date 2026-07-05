import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { SectionPanel } from "@/components/shared/section-panel";
import { formatDateIN } from "@/lib/utils/format";

export default async function VehicleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: vehicle } = await supabase.from("vehicles").select("*").eq("id", id).single();
  if (!vehicle) notFound();

  return (
    <div>
      <PageHeader title={vehicle.registration_number} />
      <SectionPanel title="Details & compliance">
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-2xs font-semibold uppercase tracking-wide text-muted-foreground">Status</dt>
            <dd className="mt-0.5 capitalize">{vehicle.current_status}</dd>
          </div>
          <div>
            <dt className="text-2xs font-semibold uppercase tracking-wide text-muted-foreground">Category</dt>
            <dd className="mt-0.5">{vehicle.category}</dd>
          </div>
          <div>
            <dt className="text-2xs font-semibold uppercase tracking-wide text-muted-foreground">Last odometer</dt>
            <dd className="mt-0.5 tabular-nums">{vehicle.last_odometer_reading} km</dd>
          </div>
          <div>
            <dt className="text-2xs font-semibold uppercase tracking-wide text-muted-foreground">Insurance expiry</dt>
            <dd className="mt-0.5 tabular-nums">{formatDateIN(vehicle.insurance_expiry)}</dd>
          </div>
          <div>
            <dt className="text-2xs font-semibold uppercase tracking-wide text-muted-foreground">Fitness expiry</dt>
            <dd className="mt-0.5 tabular-nums">{formatDateIN(vehicle.fitness_expiry)}</dd>
          </div>
          <div>
            <dt className="text-2xs font-semibold uppercase tracking-wide text-muted-foreground">Permit expiry</dt>
            <dd className="mt-0.5 tabular-nums">{formatDateIN(vehicle.permit_expiry)}</dd>
          </div>
        </dl>
      </SectionPanel>
    </div>
  );
}
