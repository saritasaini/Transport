"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { vehicleSchema } from "@/lib/validations/master";
import { z } from "zod";

type VehicleForm = z.infer<typeof vehicleSchema>;
import { upsertVehicle } from "@/actions/masters";
import { PageHeader } from "@/components/shared/page-header";
import { SectionPanel } from "@/components/shared/section-panel";
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

export default function NewVehiclePage() {
  const router = useRouter();
  const { register, handleSubmit, setValue, formState: { isSubmitting } } = useForm<VehicleForm>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      category: "owned",
      last_odometer_reading: 0,
    },
  });

  return (
    <div>
      <PageHeader title="Add vehicle" description="Register a new fleet vehicle" />
      <SectionPanel title="Vehicle details">
        <form
          className="max-w-2xl space-y-4"
        onSubmit={handleSubmit(async (values) => {
          const fd = new FormData();
          Object.entries(values).forEach(([k, v]) => v != null && fd.append(k, String(v)));
          const r = await upsertVehicle(fd);
          if (r?.error) toast.error(String(r.error));
          else {
            toast.success("Vehicle created");
            router.push("/dashboard/vehicles");
          }
        })}
      >
        <div>
          <Label>Registration number</Label>
          <Input {...register("registration_number")} required />
        </div>
        <div>
          <Label>Category</Label>
          <Select defaultValue="owned" onValueChange={(v) => setValue("category", v as "owned")}>
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
        <Button type="submit" disabled={isSubmitting}>Save</Button>
      </form>
      </SectionPanel>
    </div>
  );
}
