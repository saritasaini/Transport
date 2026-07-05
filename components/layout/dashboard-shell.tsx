"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import type { AppModule } from "@/types/database";
import type { SessionContext } from "@/lib/auth/session";
import { Navbar } from "@/components/layout/navbar";
import { TenantBanner } from "@/components/layout/tenant-banner";
import { NavContent, Sidebar, SidebarBrand } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { GlobalSearch } from "@/components/layout/global-search";

export function DashboardShell({
  modules,
  ctx,
  unreadCount,
  children,
}: {
  modules: AppModule[];
  ctx: SessionContext;
  unreadCount: number;
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        modules={modules}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
        showPlatformLink={ctx.isSuperAdmin}
      />
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 p-0 sm:max-w-xs">
          <SheetTitle className="sr-only">Navigation menu</SheetTitle>
          <SidebarBrand />
          <NavContent
            modules={modules}
            onNavigate={() => setMobileOpen(false)}
            showPlatformLink={ctx.isSuperAdmin}
          />
        </SheetContent>
      </Sheet>
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <TenantBanner ctx={ctx} />
        <Navbar
          ctx={ctx}
          unreadCount={unreadCount}
          onSearchClick={() => setSearchOpen(true)}
          menuTrigger={
            <Button
              variant="ghost"
              size="icon"
              className="h-11 w-11 shrink-0 lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
          }
        />
        <main className="flex-1 overflow-y-auto bg-muted/25 p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
}
