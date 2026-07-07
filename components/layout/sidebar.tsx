"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  LayoutGrid,
  Route,
  User,
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
  ChevronsLeft,
  ChevronsRight,
  ReceiptText,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AppModule } from "@/types/database";
import { MODULE_LABELS, MODULE_ROUTES, NAV_GROUPS } from "@/lib/constants";
import { Button } from "@/components/ui/button";

const ICONS: Partial<Record<AppModule, LucideIcon>> = {
  dashboard: LayoutGrid,
  trips: Route,
  drivers: User,
  vehicles: Truck,
  challans: FileSpreadsheet,
  parties: Building2,
  expenses: Receipt,
  payments: CreditCard,
  rentals: ArrowLeftRight,
  reports: BarChart3,
  notifications: Bell,
  branches: Building2, 
  users: Users, 
  tally: FileSpreadsheet,
  job_sheet: ReceiptText,
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
    <nav className="flex-1 overflow-y-auto py-4">
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
            <Shield className="h-5 w-5 shrink-0" />
            {!collapsed && <span>Platform</span>}
          </Link>
        </div>
      )}
      {groups.map((group) => (
        <div key={group.label} className="mb-6 last:mb-0">
          {!collapsed && (
            <p className="mb-3 px-6 text-xs font-bold uppercase tracking-wider text-slate-500">
              {group.label}
            </p>
          )}
          <ul className="space-y-1">
            {group.items.map((mod) => {
              const href = MODULE_ROUTES[mod];
              const Icon = ICONS[mod] ?? LayoutDashboard;
              const active =
                href === "/dashboard" 
                  ? pathname === href 
                  : pathname === href || pathname.startsWith(href + "/");
              
              const isNotifications = mod === 'notifications';
              
              return (
                <li key={mod}>
                  <Link
                    href={href}
                    className={cn(
                      "nav-item",
                      active && "nav-item-active",
                      collapsed && "mx-3 px-0 justify-center rounded-xl before:rounded-xl"
                    )}
                    title={MODULE_LABELS[mod]}
                    aria-current={active ? "page" : undefined}
                    onClick={onNavigate}
                  >
                    <Icon className={cn("h-[18px] w-[18px] shrink-0", active ? "text-blue-600" : "text-slate-500")} strokeWidth={active ? 2 : 1.5} />
                    {!collapsed && (
                      <span className="flex-1 truncate">{MODULE_LABELS[mod]}</span>
                    )}
                    {!collapsed && isNotifications && (
                      <div className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-bold text-blue-600 ml-auto">
                        9+
                      </div>
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
  if (collapsed) {
    return (
      <div className="flex h-16 items-center justify-center border-b border-sidebar-border py-2">
        <button
          onClick={onToggleCollapse}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm transition-transform hover:scale-105 active:scale-95"
          aria-label="Expand sidebar"
        >
          <Truck className="h-5 w-5" strokeWidth={2} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4 py-2">
      <div className="flex items-center gap-3 min-w-0">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm"
          aria-hidden
        >
          <Truck className="h-5 w-5" strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1 flex flex-col justify-center">
          <p className="truncate text-[15px] font-bold leading-tight text-slate-900">
            Fleet Control
          </p>
          <p className="truncate text-[13px] text-slate-500 font-medium">
            Transport ops
          </p>
        </div>
      </div>
      {showCollapse && onToggleCollapse && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 text-slate-400 hover:bg-slate-100 hover:text-slate-600 ml-1"
          onClick={onToggleCollapse}
          aria-label="Collapse sidebar"
        >
          <ChevronsLeft className="h-5 w-5" />
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
        "hidden h-screen flex-col border-r border-sidebar-border bg-white transition-[width] duration-200 ease-out lg:flex",
        collapsed ? "w-[4.5rem]" : "w-64"
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
