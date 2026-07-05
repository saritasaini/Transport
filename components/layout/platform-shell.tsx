"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, LogOut, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { PLATFORM_NAV } from "@/lib/constants-platform";
import { Button } from "@/components/ui/button";
import { signOut } from "@/actions/auth";
import type { SessionContext } from "@/lib/auth/session";

export function PlatformShell({
  ctx,
  children,
}: {
  ctx: SessionContext;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside className="flex w-56 flex-col border-r border-sidebar-border bg-sidebar">
        <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Shield className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">Fleet Control</p>
            <p className="truncate text-2xs text-muted-foreground">Platform admin</p>
          </div>
        </div>
        <nav className="flex-1 space-y-0.5 p-2">
          {PLATFORM_NAV.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/platform" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "nav-item",
                  active && "nav-item-active"
                )}
              >
                {item.label === "Companies" && (
                  <Building2 className="h-4 w-4 shrink-0 opacity-80" />
                )}
                {item.label === "Overview" && (
                  <Shield className="h-4 w-4 shrink-0 opacity-80" />
                )}
                {item.label === "Users" && (
                  <Building2 className="h-4 w-4 shrink-0 opacity-80" />
                )}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-sidebar-border p-3">
          <p className="mb-2 truncate text-2xs text-muted-foreground">
            {ctx.profile.full_name}
          </p>
          <form action={signOut}>
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </form>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
