"use client";

import { updateTripStatus } from "@/actions/trips";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { TripStatus } from "@/types/database";
import { toast } from "sonner";
import { useState } from "react";

const NEXT: Partial<Record<TripStatus, TripStatus[]>> = {
  pending: ["assigned", "cancelled"],
  assigned: ["in_transit", "hold", "cancelled"],
  in_transit: ["hold", "completed", "cancelled"],
  hold: ["in_transit", "cancelled"],
};

export function TripStatusActions({
  tripId,
  status,
  isLocked,
  role,
}: {
  tripId: string;
  status: TripStatus;
  isLocked: boolean;
  role: string;
}) {
  const [odometerEnd, setOdometerEnd] = useState("");
  const options = NEXT[status] ?? [];

  if (isLocked && !["transporter_admin", "super_admin"].includes(role)) {
    return <p className="text-sm text-muted-foreground">Trip is locked (completed).</p>;
  }

  async function changeTo(next: TripStatus) {
    const fd = new FormData();
    fd.set("status", next);
    if (next === "completed") fd.set("odometer_end", odometerEnd);
    const result = await updateTripStatus(tripId, fd);
    if (result?.error) toast.error(String(result.error));
    else toast.success("Status updated");
  }

  return (
    <div className="space-y-3">
      {status === "in_transit" && (
        <div>
          <Label>Odometer end (required to complete)</Label>
          <Input
            type="number"
            value={odometerEnd}
            onChange={(e) => setOdometerEnd(e.target.value)}
          />
        </div>
      )}
      {options.map((s) => (
        <Button
          key={s}
          variant={s === "cancelled" ? "destructive" : "default"}
          className="w-full"
          onClick={() => changeTo(s)}
        >
          Mark {s.replace(/_/g, " ")}
        </Button>
      ))}
    </div>
  );
}
