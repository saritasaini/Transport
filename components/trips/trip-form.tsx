"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { tripSchema, type TripFormValues } from "@/lib/validations/trip";
import { createTrip } from "@/actions/trips";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

type Option = { id: string; label: string };

export function TripForm({
  customers,
  vehicles,
  drivers,
  branches,
}: {
  customers: Option[];
  vehicles: Option[];
  drivers: Option[];
  branches: Option[];
}) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<TripFormValues>({
    resolver: zodResolver(tripSchema),
    defaultValues: {
      trip_date: new Date().toISOString().slice(0, 10),
      bill_amount: 0,
    },
  });

  async function onSubmit(values: TripFormValues) {
    const fd = new FormData();
    Object.entries(values).forEach(([k, v]) => {
      if (v != null && v !== "") fd.append(k, String(v));
    });
    const result = await createTrip(fd);
    if (result?.error) {
      toast.error(typeof result.error === "string" ? result.error : "Validation error");
      return;
    }
    toast.success("Trip created");
    router.push(`/dashboard/trips`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-4">
      <div>
        <Label>Customer *</Label>
        <Select onValueChange={(v) => setValue("customer_id", v)}>
          <SelectTrigger>
            <SelectValue placeholder="Select customer" />
          </SelectTrigger>
          <SelectContent>
            {customers.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.customer_id && (
          <p className="text-sm text-destructive">{errors.customer_id.message}</p>
        )}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>Vehicle (available)</Label>
          <Select onValueChange={(v) => setValue("vehicle_id", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select free vehicle..." />
            </SelectTrigger>
            <SelectContent>
              {vehicles.map((v) => (
                <SelectItem key={v.id} value={v.id}>
                  {v.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Driver (available)</Label>
          <Select onValueChange={(v) => setValue("driver_id", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select free driver..." />
            </SelectTrigger>
            <SelectContent>
              {drivers.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label>Branch</Label>
        <Select onValueChange={(v) => setValue("branch_id", v)}>
          <SelectTrigger>
            <SelectValue placeholder="Select branch" />
          </SelectTrigger>
          <SelectContent>
            {branches.map((b) => (
              <SelectItem key={b.id} value={b.id}>
                {b.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>Origin *</Label>
          <Input {...register("origin")} />
        </div>
        <div>
          <Label>Destination *</Label>
          <Input {...register("destination")} />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>Start location *</Label>
          <Input {...register("start_location")} />
        </div>
        <div>
          <Label>Fleet origin *</Label>
          <Input {...register("fleet_origin")} />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>Trip date</Label>
          <Input type="date" {...register("trip_date")} />
        </div>
        <div>
          <Label>Bill amount (₹)</Label>
          <Input type="number" step="0.01" {...register("bill_amount")} />
        </div>
      </div>
      <div>
        <Label>Notes</Label>
        <Textarea {...register("notes")} />
      </div>
      <Button type="submit" disabled={isSubmitting}>
        Create trip
      </Button>
    </form>
  );
}
