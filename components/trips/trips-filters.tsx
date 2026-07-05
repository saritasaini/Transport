"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export function TripsFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  function apply(key: string, value: string) {
    const p = new URLSearchParams(searchParams.toString());
    if (value) p.set(key, value);
    else p.delete(key);
    router.push(`/dashboard/trips?${p.toString()}`);
  }

  return (
    <form
      className="mb-4 grid gap-3 rounded-lg border p-4 sm:grid-cols-2 lg:grid-cols-5"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        ["status", "from", "to"].forEach((k) => apply(k, String(fd.get(k) ?? "")));
      }}
    >
      <div>
        <Label>Status</Label>
        <Select
          defaultValue={searchParams.get("status") ?? ""}
          onValueChange={(v) => apply("status", v === "all" ? "" : v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {["pending", "assigned", "in_transit", "hold", "cancelled", "completed"].map(
              (s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              )
            )}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>From date</Label>
        <Input name="from" type="date" defaultValue={searchParams.get("from") ?? ""} />
      </div>
      <div>
        <Label>To date</Label>
        <Input name="to" type="date" defaultValue={searchParams.get("to") ?? ""} />
      </div>
      <div className="flex items-end">
        <Button type="submit">Apply filters</Button>
      </div>
    </form>
  );
}
