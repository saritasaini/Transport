import { Badge } from "@/components/ui/badge";
import { TRIP_STATUS_COLORS, TRIP_STATUS_LABELS } from "@/lib/constants";
import type { TripStatus } from "@/types/database";
import { cn } from "@/lib/utils";

export function TripStatusBadge({
  status,
  className,
}: {
  status: TripStatus;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "border-transparent px-2 py-0.5 text-2xs font-semibold uppercase tracking-wide",
        TRIP_STATUS_COLORS[status],
        className
      )}
    >
      {TRIP_STATUS_LABELS[status]}
    </Badge>
  );
}
