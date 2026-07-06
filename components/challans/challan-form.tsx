"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { challanSchema } from "@/lib/validations/master";
import { z } from "zod";
import { upsertChallan } from "@/actions/finance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

type ChallanFormValues = z.infer<typeof challanSchema>;

interface ChallanFormProps {
  initialData?: Partial<ChallanFormValues> & { id?: string };
  vehicles: { id: string; registration_number: string }[];
  drivers: { id: string; full_name: string }[];
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ChallanForm({ initialData, vehicles, drivers, onSuccess, onCancel }: ChallanFormProps) {
  const router = useRouter();
  const { register, handleSubmit, setValue, watch, formState: { isSubmitting } } = useForm<ChallanFormValues>({
    resolver: zodResolver(challanSchema),
    defaultValues: {
      vehicle_id: initialData?.vehicle_id || "",
      driver_id: initialData?.driver_id || "",
      challan_no: initialData?.challan_no || "",
      amount: initialData?.amount || 0,
      issue_date: initialData?.issue_date || new Date().toISOString().split("T")[0],
      status: initialData?.status || "pending",
      deduct_from_driver: initialData?.deduct_from_driver ?? false,
      notes: initialData?.notes || "",
    },
  });

  const isDeductFromDriver = watch("deduct_from_driver");

  return (
    <form
      className="space-y-6 max-w-2xl"
      onSubmit={handleSubmit(async (values) => {
        const fd = new FormData();
        Object.entries(values).forEach(([k, v]) => v != null && fd.append(k, String(v)));
        const r = await upsertChallan(fd, initialData?.id);
        if (r?.error) toast.error(String(r.error));
        else {
          toast.success(initialData?.id ? "Challan updated" : "Challan saved");
          if (onSuccess) onSuccess();
          else {
            router.push("/dashboard/challans");
            router.refresh();
          }
        }
      })}
    >
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Challan Number</Label>
          <Input placeholder="e.g. MH992304..." {...register("challan_no")} required />
        </div>
        <div className="space-y-2">
          <Label>Issue Date</Label>
          <Input type="date" {...register("issue_date")} required />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Vehicle Registration</Label>
          <Select 
            defaultValue={initialData?.vehicle_id} 
            onValueChange={(v) => setValue("vehicle_id", v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select vehicle" />
            </SelectTrigger>
            <SelectContent>
              {vehicles.map((v) => (
                <SelectItem key={v.id} value={v.id}>
                  {v.registration_number}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Driver Name</Label>
          <Select 
            defaultValue={initialData?.driver_id || ""} 
            onValueChange={(v) => setValue("driver_id", v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select driver" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {drivers.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Fine Amount (₹)</Label>
          <Input type="number" step="0.01" {...register("amount")} required />
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <Select 
            defaultValue={initialData?.status || "pending"} 
            onValueChange={(v) => setValue("status", v as any)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="contested">Contested</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center space-x-2 pt-2">
        <Checkbox 
          id="deduct" 
          checked={isDeductFromDriver} 
          onCheckedChange={(checked) => setValue("deduct_from_driver", checked as boolean)} 
        />
        <div className="grid gap-1.5 leading-none">
          <label
            htmlFor="deduct"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Deduct from Driver
          </label>
          <p className="text-sm text-muted-foreground">
            Mark this fine to be deducted from the driver&apos;s next settlement
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Notes</Label>
        <Textarea placeholder="Details of the violation..." {...register("notes")} />
      </div>

      <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save Challan"}
        </Button>
      </div>
    </form>
  );
}
