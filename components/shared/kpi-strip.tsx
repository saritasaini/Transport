import { cn } from "@/lib/utils";
import { type LucideIcon } from "lucide-react";

export type KpiColor = "blue" | "orange" | "green" | "purple" | "cyan";

export type KpiItem = {
  label: string;
  value: string | number;
  hint?: React.ReactNode;
  icon?: LucideIcon;
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
    <div className="-mx-4 overflow-x-auto px-4 lg:mx-0 lg:px-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pb-4">
      <dl
        className={cn(
          "flex w-max gap-4",
          className
        )}
      >
        {items.map((item) => (
          <div
            key={item.label}
            className="flex min-w-[14rem] items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-sm"
          >
            {item.icon && (
              <div
                className={cn(
                  "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl",
                  item.iconColor ? colorMap[item.iconColor] : "bg-muted text-muted-foreground"
                )}
              >
                <item.icon className="h-6 w-6" strokeWidth={1.5} />
              </div>
            )}
            <div className="flex flex-col gap-1">
              <dt className="text-sm font-medium text-muted-foreground">
                {item.label}
              </dt>
              <dd className="text-2xl font-bold tracking-tight text-foreground">
                {item.value}
              </dd>
              <dd className="text-xs text-muted-foreground min-h-[1rem]">
                {item.hint || "—"}
              </dd>
            </div>
          </div>
        ))}
      </dl>
    </div>
  );
}
