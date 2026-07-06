"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { vehicleSchema } from "@/lib/validations/master";
import { z } from "zod";
import { upsertVehicle } from "@/actions/masters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

type VehicleFormValues = z.infer<typeof vehicleSchema>;

interface VehicleFormProps {
  initialData?: Partial<VehicleFormValues> & { id?: string };
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function VehicleForm({ initialData, onSuccess, onCancel }: VehicleFormProps) {
  const router = useRouter();
  const { register, handleSubmit, setValue, formState: { isSubmitting } } = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      registration_number: initialData?.registration_number || "",
      category: initialData?.category || "owned",
      vehicle_type: initialData?.vehicle_type || "",
      insurance_expiry: initialData?.insurance_expiry || "",
      last_odometer_reading: initialData?.last_odometer_reading || 0,
      fitness_expiry: initialData?.fitness_expiry || "",
      permit_expiry: initialData?.permit_expiry || "",
    },
  });

  return (
    <form
      className="space-y-4"
      onSubmit={handleSubmit(async (values) => {
        const fd = new FormData();
        Object.entries(values).forEach(([k, v]) => v != null && fd.append(k, String(v)));
        const r = await upsertVehicle(fd, initialData?.id);
        if (r?.error) toast.error(String(r.error));
        else {
          toast.success(initialData?.id ? "Vehicle updated" : "Vehicle created");
          if (onSuccess) onSuccess();
          else router.push("/dashboard/vehicles");
        }
      })}
    >
      <div>
        <Label>Registration number</Label>
        <Input {...register("registration_number")} required />
      </div>
      <div>
        <Label>Category</Label>
        <Select defaultValue={initialData?.category || "owned"} onValueChange={(v) => setValue("category", v as "owned")}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="owned">Owned</SelectItem>
            <SelectItem value="rented">Rented</SelectItem>
            <SelectItem value="leased">Leased</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Vehicle type</Label>
        <Input {...register("vehicle_type")} />
      </div>
      <div>
        <Label>Insurance expiry</Label>
        <Input type="date" {...register("insurance_expiry")} />
      </div>
      <div className="flex justify-end space-x-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {initialData?.id ? "Save Changes" : "Save"}
        </Button>
      </div>
    </form>
  );
}
