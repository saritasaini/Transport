"use client";

import { useState, useEffect } from "react";
import { Search, Loader2, Truck, User, FileText, Wallet } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useRouter } from "next/navigation";

export function GlobalSearch({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [query, setQuery] = useState("");
  const router = useRouter();

  // Mock results for now until API is ready
  const results = query.length > 2 ? [
    { type: "trip", label: "Trip TRP-2501 to Mumbai", url: "/dashboard/trips/1", icon: Truck },
    { type: "driver", label: "Ramesh Singh (Driver)", url: "/dashboard/drivers/1", icon: User },
    { type: "vehicle", label: "MH 04 AB 1234", url: "/dashboard/vehicles/1", icon: Truck },
    { type: "party", label: "Reliance Industries", url: "/dashboard/parties/1", icon: Wallet },
  ] : [];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 sm:max-w-[600px] gap-0 border-0 shadow-2xl overflow-hidden rounded-xl" aria-describedby={undefined}>
        <DialogTitle className="sr-only">Global Search</DialogTitle>
        <div className="flex items-center border-b px-3">
          <Search className="mr-2 h-5 w-5 shrink-0 text-slate-400" />
          <input
            className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Search trips, vehicles, drivers, parties..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
        </div>
        <div className="max-h-[300px] overflow-y-auto p-2">
          {query.length === 0 && (
            <p className="p-4 text-center text-sm text-slate-500">
              Start typing to search across your fleet...
            </p>
          )}
          {query.length > 0 && query.length <= 2 && (
            <p className="p-4 text-center text-sm text-slate-500">
              Type at least 3 characters to search
            </p>
          )}
          {query.length > 2 && results.length === 0 && (
            <p className="p-4 text-center text-sm text-slate-500">
              No results found for &quot;{query}&quot;
            </p>
          )}
          {results.map((result, i) => (
            <div
              key={i}
              onClick={() => {
                onOpenChange(false);
                router.push(result.url);
              }}
              className="flex cursor-pointer items-center gap-3 rounded-lg px-4 py-2 hover:bg-slate-100"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100">
                <result.icon className="h-4 w-4 text-slate-600" />
              </div>
              <span className="text-sm font-medium text-slate-900">{result.label}</span>
              <span className="ml-auto text-xs text-slate-400 uppercase">{result.type}</span>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
