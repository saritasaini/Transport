import Link from "next/link";
import { Building2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { clearActiveTenant } from "@/actions/platform";
import type { SessionContext } from "@/lib/auth/session";

export function TenantBanner({ ctx }: { ctx: SessionContext }) {
  if (!ctx.isSuperAdmin || !ctx.effectiveCompanyId) return null;

  return (
    <div className="flex flex-col gap-2 border-b border-primary/20 bg-primary/5 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between">
      <p className="flex items-center gap-2 text-sm">
        <Building2 className="h-4 w-4 text-primary" aria-hidden />
        <span>
          Managing tenant:{" "}
          <span className="font-semibold text-foreground">
            {ctx.activeTenantName ?? "Company"}
          </span>
        </span>
      </p>
      <div className="flex shrink-0 gap-2">
        <Button asChild size="sm" variant="outline">
          <Link href="/platform/companies">Switch company</Link>
        </Button>
        <form action={clearActiveTenant}>
          <Button type="submit" size="sm" variant="ghost" className="gap-1">
            <X className="h-4 w-4" />
            Exit to platform
          </Button>
        </form>
      </div>
    </div>
  );
}
