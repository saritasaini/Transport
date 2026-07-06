import { cn } from "@/lib/utils";
import { type LucideIcon } from "lucide-react";

export type KpiColor = "blue" | "orange" | "green" | "purple" | "cyan";

export type KpiItem = {
  label: string;
  value: string | number;
  hint?: React.ReactNode;
  icon?: React.ElementType;
  iconColor?: KpiColor;
};

const colorMap: Record<KpiColor, string> = {
  blue: "bg-blue-50 text-blue-600",
  orange: "bg-orange-50 text-orange-600",
  green: "bg-green-50 text-green-600",
  purple: "bg-purple-50 text-purple-600",
  cyan: "bg-cyan-50 text-cyan-600",
};

/** Dashboard KPI cards with left icon and right text */
export function KpiStrip({ items, className }: { items: KpiItem[]; className?: string }) {
  return (
    <div className="-mx-4 overflow-x-auto px-4 lg:mx-0 lg:px-0 pb-4">
      <dl
        className={cn(
          "flex flex-nowrap md:flex-wrap gap-4",
          className
        )}
      >
        {items.map((item) => (
          <div
            key={item.label}
            className="flex flex-col rounded-2xl border border-slate-100 bg-white p-3.5 shadow-sm min-w-[12rem] flex-auto"
          >
            <div className="flex items-center gap-3">
              {item.icon && (
                <div
                  className={cn(
                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-full",
                    item.iconColor ? colorMap[item.iconColor] : "bg-slate-50 text-slate-500"
                  )}
                >
                  <item.icon className="h-5 w-5" strokeWidth={2} />
                </div>
              )}
              <div className="flex flex-col">
                <dt className="text-xs font-semibold text-slate-500 truncate">
                  {item.label}
                </dt>
                <dd className="text-2xl font-bold tracking-tight text-slate-900 leading-none mt-1">
                  {item.value}
                </dd>
              </div>
            </div>
            <dd className="mt-3 text-center text-xs font-medium text-slate-400">
              {item.hint || "—"}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
