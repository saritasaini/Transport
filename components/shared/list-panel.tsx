import { cn } from "@/lib/utils";

export function ListPanel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("surface-section divide-y divide-border/60", className)}>
      {children}
    </div>
  );
}

export function ListPanelItem({
  children,
  className,
  highlighted,
}: {
  children: React.ReactNode;
  className?: string;
  highlighted?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between",
        highlighted && "bg-muted/40",
        className
      )}
    >
      {children}
    </div>
  );
}
