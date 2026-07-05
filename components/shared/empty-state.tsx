import { Truck, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmptyState({
  title,
  description,
  action,
  icon: Icon = Truck,
  className,
  compact = false,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: LucideIcon;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-md bg-muted/30 text-center",
        compact ? "px-4 py-8" : "px-6 py-12",
        className
      )}
    >
      <div
        className={cn(
          "mb-3 flex items-center justify-center rounded-full bg-muted",
          compact ? "h-10 w-10" : "h-12 w-12"
        )}
      >
        <Icon
          className={cn(
            "text-muted-foreground",
            compact ? "h-5 w-5" : "h-6 w-6"
          )}
          aria-hidden
        />
      </div>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function TableEmptyRow({
  colSpan,
  title,
  description,
}: {
  colSpan: number;
  title: string;
  description?: string;
}) {
  return (
    <tr>
      <td colSpan={colSpan} className="p-0">
        <EmptyState
          title={title}
          description={description}
          compact
          className="rounded-none border-0 bg-transparent"
        />
      </td>
    </tr>
  );
}
