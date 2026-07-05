import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { SectionPanel } from "@/components/shared/section-panel";
import { CompanyForm } from "@/components/platform/company-form";
import { Button } from "@/components/ui/button";
import { openTenantWorkspace, toggleCompanyActive } from "@/actions/platform";

export default async function PlatformCompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: company } = await supabase
    .from("companies")
    .select("*")
    .eq("id", id)
    .single();

  if (!company) notFound();

  const [
    { count: userCount },
    { count: tripCount },
    { count: vehicleCount },
  ] = await Promise.all([
    supabase.from("users").select("*", { count: "exact", head: true }).eq("company_id", id),
    supabase.from("trips").select("*", { count: "exact", head: true }).eq("company_id", id),
    supabase.from("vehicles").select("*", { count: "exact", head: true }).eq("company_id", id),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={company.name}
        description="Tenant configuration and workspace access"
        action={
          company.is_active !== false ? (
            <form action={openTenantWorkspace}>
              <input type="hidden" name="companyId" value={id} />
              <Button type="submit">Open fleet workspace</Button>
            </form>
          ) : undefined
        }
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <SectionPanel title="Users" contentClassName="p-4">
          <p className="text-2xl font-semibold tabular-nums">{userCount ?? 0}</p>
        </SectionPanel>
        <SectionPanel title="Trips" contentClassName="p-4">
          <p className="text-2xl font-semibold tabular-nums">{tripCount ?? 0}</p>
        </SectionPanel>
        <SectionPanel title="Vehicles" contentClassName="p-4">
          <p className="text-2xl font-semibold tabular-nums">{vehicleCount ?? 0}</p>
        </SectionPanel>
      </div>
      <SectionPanel title="Edit company">
        <CompanyForm company={company} />
      </SectionPanel>
      <SectionPanel title="Status">
        <div className="flex flex-wrap gap-2">
          {company.is_active === false ? (
            <form action={toggleCompanyActive}>
              <input type="hidden" name="id" value={id} />
              <input type="hidden" name="isActive" value="true" />
              <Button type="submit" variant="outline">
                Activate company
              </Button>
            </form>
          ) : (
            <form action={toggleCompanyActive}>
              <input type="hidden" name="id" value={id} />
              <input type="hidden" name="isActive" value="false" />
              <Button type="submit" variant="destructive">
                Deactivate company
              </Button>
            </form>
          )}
          <Button asChild variant="ghost">
            <Link href="/platform/companies">Back to list</Link>
          </Button>
        </div>
      </SectionPanel>
    </div>
  );
}
