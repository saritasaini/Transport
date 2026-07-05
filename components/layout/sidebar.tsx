"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Route,
  Users,
  Truck,
  Building2,
  Receipt,
  CreditCard,
  ArrowLeftRight,
  BarChart3,
  Bell,
  Settings,
  FileSpreadsheet,
  Archive,
  PanelLeftClose,
  PanelLeft,
  Shield,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AppModule } from "@/types/database";
import { MODULE_LABELS, MODULE_ROUTES, NAV_GROUPS } from "@/lib/constants";
import { Button } from "@/components/ui/button";

const ICONS: Partial<Record<AppModule, LucideIcon>> = {
  dashboard: LayoutDashboard,
  trips: Route,
  drivers: Users,
  vehicles: Truck,
  parties: Building2,
  expenses: Receipt,
  payments: CreditCard,
  rentals: ArrowLeftRight,
  reports: BarChart3,
  notifications: Bell,
  branches: Settings,
  users: Users,
  tally: FileSpreadsheet,
  recovery: Archive,
};

export function NavContent({
  modules,
  collapsed = false,
  onNavigate,
  showPlatformLink = false,
}: {
  modules: AppModule[];
  collapsed?: boolean;
  onNavigate?: () => void;
  showPlatformLink?: boolean;
}) {
  const pathname = usePathname();

  const groups = NAV_GROUPS.map((g) => ({
    ...g,
    items: g.modules.filter((m) => modules.includes(m)),
  })).filter((g) => g.items.length > 0);

  return (
    <nav className="flex-1 overflow-y-auto px-2 py-3">
      {showPlatformLink && (
        <div className="mb-4">
          <Link
            href="/platform"
            className={cn(
              "nav-item",
              pathname.startsWith("/platform") && "nav-item-active"
            )}
            onClick={onNavigate}
          >
            <Shield className="h-4 w-4 shrink-0 opacity-80" />
            {!collapsed && <span>Platform</span>}
          </Link>
        </div>
      )}
      {groups.map((group) => (
        <div key={group.label} className="mb-4 last:mb-0">
          {!collapsed && (
            <p className="mb-1.5 px-2.5 text-2xs font-semibold uppercase tracking-wider text-sidebar-foreground/50">
              {group.label}
            </p>
          )}
          <ul className="space-y-0.5">
            {group.items.map((mod) => {
              const href = MODULE_ROUTES[mod];
              const Icon = ICONS[mod] ?? LayoutDashboard;
              const active =
                pathname === href || pathname.startsWith(href + "/");
              return (
                <li key={mod}>
                  <Link
                    href={href}
                    className={cn("nav-item", active && "nav-item-active")}
                    title={MODULE_LABELS[mod]}
                    aria-current={active ? "page" : undefined}
                    onClick={onNavigate}
                  >
                    <Icon className="h-4 w-4 shrink-0 opacity-80" />
                    {!collapsed && (
                      <span className="truncate">{MODULE_LABELS[mod]}</span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function SidebarHeader({
  collapsed,
  onToggleCollapse,
  showCollapse = true,
}: {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  showCollapse?: boolean;
}) {
  return (
    <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-3">
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground"
        aria-hidden
      >
        <Truck className="h-4 w-4" />
      </div>
      {!collapsed && (
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-sidebar-accent-foreground">
            Fleet Control
          </p>
          <p className="truncate text-2xs text-sidebar-foreground/70">
            Transport ops
          </p>
        </div>
      )}
      {showCollapse && onToggleCollapse && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          onClick={onToggleCollapse}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <PanelLeft className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </Button>
      )}
    </div>
  );
}

export function SidebarBrand() {
  return <SidebarHeader showCollapse={false} />;
}

export function Sidebar({
  modules,
  collapsed,
  onToggleCollapse,
  showPlatformLink,
}: {
  modules: AppModule[];
  collapsed: boolean;
  onToggleCollapse: () => void;
  showPlatformLink?: boolean;
}) {
  return (
    <aside
      className={cn(
        "hidden h-screen flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200 ease-out lg:flex",
        collapsed ? "w-[4.25rem]" : "w-60"
      )}
    >
      <SidebarHeader
        collapsed={collapsed}
        onToggleCollapse={onToggleCollapse}
      />
      <NavContent
        modules={modules}
        collapsed={collapsed}
        showPlatformLink={showPlatformLink}
      />
    </aside>
  );
}
