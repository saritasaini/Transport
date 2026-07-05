import Link from "next/link";
import { Bell, LogOut, Search, Plus, MessageSquare, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOut } from "@/actions/auth";
import type { SessionContext } from "@/lib/auth/session";
import { cn } from "@/lib/utils";

function formatRole(role: string) {
  return role.replace(/_/g, " ");
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
}

export function Navbar({
  ctx,
  unreadCount,
  menuTrigger,
}: {
  ctx: SessionContext;
  unreadCount: number;
  menuTrigger?: React.ReactNode;
}) {
  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-4">
      {/* Left Section: User Info */}
      <div className="flex min-w-0 items-center gap-4 w-1/4">
        {menuTrigger}
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold text-foreground">
            {ctx.profile.full_name}
          </p>
          <span className="hidden shrink-0 rounded-md border border-border bg-muted/60 px-2 py-0.5 text-2xs font-medium capitalize text-primary sm:inline">
            {formatRole(ctx.role)}
          </span>
        </div>
      </div>

      {/* Middle Section: Search Bar */}
      <div className="hidden flex-1 max-w-xl items-center justify-center px-4 md:flex">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search trips, vehicles, drivers..."
            className="h-9 w-full rounded-md border border-border bg-background pl-9 pr-14 text-sm outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 rounded border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            <span>Ctrl + K</span>
          </div>
        </div>
      </div>

      {/* Right Section: Actions */}
      <div className="flex items-center gap-3 w-1/4 justify-end">
        <Button size="icon" className="h-8 w-8 rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="relative h-9 w-9 text-muted-foreground hover:bg-muted" asChild>
          <Link href="/dashboard/notifications" aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}>
            <Bell className="h-[1.125rem] w-[1.125rem]" />
            {unreadCount > 0 && (
              <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-none text-destructive-foreground">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>
        </Button>
        <Button variant="ghost" size="icon" className="relative h-9 w-9 text-muted-foreground hover:bg-muted">
          <MessageSquare className="h-[1.125rem] w-[1.125rem]" />
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold leading-none text-primary-foreground">3</span>
        </Button>
        <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:bg-muted">
          <Settings className="h-[1.125rem] w-[1.125rem]" />
        </Button>
        
        <form action={signOut} className="ml-1">
          <button type="submit" className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-primary hover:bg-blue-200" aria-label="Sign out">
            {getInitials(ctx.profile.full_name)}
          </button>
        </form>
      </div>
    </header>
  );
}
