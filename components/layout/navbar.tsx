import Link from "next/link";
import { Bell, Search, Plus, MessageSquareText, Settings, ChevronDown, Truck, FilePlus, UserPlus, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
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
  unreadMessageCount = 0,
  menuTrigger,
  onSearchClick,
}: {
  ctx: SessionContext;
  unreadCount: number;
  unreadMessageCount?: number;
  menuTrigger?: React.ReactNode;
  onSearchClick?: () => void;
}) {
  return (
    <header className="sticky top-0 z-10 flex h-[60px] shrink-0 items-center justify-between border-b border-border bg-white px-4">
      {/* Left Section: User Info */}
      <div className="flex flex-1 min-w-0 items-center gap-2 sm:gap-4">
        {menuTrigger}
        <div className="flex items-center gap-2 overflow-hidden">
          <p className="truncate text-sm font-semibold text-slate-900">
            {ctx.profile.full_name}
          </p>
          <span className="hidden shrink-0 rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium capitalize text-blue-600 sm:inline">
            {formatRole(ctx.role)}
          </span>
        </div>
      </div>

      {/* Middle Section: Search Bar */}
      <div className="hidden flex-1 max-w-xl items-center justify-center px-4 md:flex">
        <div 
          className="relative w-full cursor-text"
          onClick={onSearchClick}
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search trips, vehicles, drivers..."
            readOnly
            className="h-10 w-full rounded-md border border-slate-200 bg-white pl-9 pr-14 text-sm outline-none placeholder:text-slate-400 cursor-pointer hover:border-slate-300"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
            <span>Ctrl + K</span>
          </div>
        </div>
      </div>

      {/* Right Section: Actions */}
      <div className="flex shrink-0 items-center gap-1 sm:gap-2 md:gap-4 justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" className="h-9 w-9 shrink-0 rounded-full bg-blue-600 text-white hover:bg-blue-700 shadow-sm">
              <Plus className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem asChild>
              <Link href="/dashboard/trips/new" className="cursor-pointer">
                <Truck className="mr-2 h-4 w-4" />
                <span>New Trip</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/vehicles/new" className="cursor-pointer">
                <FilePlus className="mr-2 h-4 w-4" />
                <span>Add Vehicle</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/drivers/new" className="cursor-pointer">
                <UserPlus className="mr-2 h-4 w-4" />
                <span>Add Driver</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/expenses/new" className="cursor-pointer">
                <Receipt className="mr-2 h-4 w-4" />
                <span>Add Expense</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button variant="ghost" size="icon" className="relative h-9 w-9 shrink-0 text-slate-600 hover:bg-slate-100" asChild>
          <Link href="/dashboard/notifications" aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}>
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white border-[2px] border-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>
        </Button>
        <Button variant="ghost" size="icon" className="relative h-9 w-9 shrink-0 text-slate-600 hover:bg-slate-100" asChild>
          <Link href="/dashboard/messages" aria-label="Messages">
            <MessageSquareText className="h-5 w-5" />
            {unreadMessageCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-bold leading-none text-white border-[2px] border-white">
                {unreadMessageCount > 9 ? "9+" : unreadMessageCount}
              </span>
            )}
          </Link>
        </Button>
        <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-slate-600 hover:bg-slate-100" asChild>
          <Link href="/dashboard/settings/branches" aria-label="Settings">
            <Settings className="h-5 w-5" />
          </Link>
        </Button>
        
        <form action={signOut} className="ml-1 sm:ml-2 flex items-center gap-1 cursor-pointer shrink-0">
          <button type="submit" className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-600 hover:bg-blue-200" aria-label="Sign out">
            {getInitials(ctx.profile.full_name)}
          </button>
          <ChevronDown className="hidden sm:block h-4 w-4 text-slate-500" />
        </form>
      </div>
    </header>
  );
}
