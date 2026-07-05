import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { SectionPanel } from "@/components/shared/section-panel";
import { Button } from "@/components/ui/button";
import { formatDateIN } from "@/lib/utils/format";
import { Building2, Plus, Users } from "lucide-react";

export default async function PlatformOverviewPage() {
  const supabase = await createClient();

  const [{ count: totalCompanies }, { count: activeCompanies }, { data: recent }] =
    await Promise.all([
      supabase.from("companies").select("*", { count: "exact", head: true }),
      supabase
        .from("companies")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true),
      supabase
        .from("companies")
        .select("id, name, plan, created_at, is_active")
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

  const { count: totalUsers } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform"
        description="Manage transport companies and tenant workspaces"
        action={
          <Button asChild>
            <Link href="/platform/companies/new">
              <Plus className="h-4 w-4" />
              New company
            </Link>
          </Button>
        }
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <SectionPanel title="Companies" contentClassName="p-4">
          <p className="text-3xl font-semibold tabular-nums">{totalCompanies ?? 0}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {activeCompanies ?? 0} active
          </p>
        </SectionPanel>
        <SectionPanel title="Users" contentClassName="p-4">
          <p className="text-3xl font-semibold tabular-nums">{totalUsers ?? 0}</p>
          <p className="mt-1 text-sm text-muted-foreground">Across all tenants</p>
        </SectionPanel>
        <SectionPanel title="Quick actions" contentClassName="p-4">
          <div className="flex flex-col gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/platform/companies">
                <Building2 className="h-4 w-4" />
                All companies
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/platform/users">
                <Users className="h-4 w-4" />
                All users
              </Link>
            </Button>
          </div>
        </SectionPanel>
      </div>
      <SectionPanel title="Recent companies">
        {!recent?.length ? (
          <p className="text-sm text-muted-foreground">No companies yet.</p>
        ) : (
          <ul className="divide-y divide-border/60">
            {recent.map((c) => (
              <li
                key={c.id}
                className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <Link
                    href={`/platform/companies/${c.id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {c.name}
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    {c.plan ?? "starter"} · {formatDateIN(c.created_at)}
                    {!c.is_active && " · Inactive"}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </SectionPanel>
    </div>
  );
}
