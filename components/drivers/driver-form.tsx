"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { driverSchema } from "@/lib/validations/master";
import { upsertDriver } from "@/actions/masters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { z } from "zod";

type DriverFormValues = z.infer<typeof driverSchema>;

interface DriverFormProps {
  initialData?: Partial<DriverFormValues> & { id?: string };
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function DriverForm({ initialData, onSuccess, onCancel }: DriverFormProps) {
  const router = useRouter();
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<DriverFormValues>({
    resolver: zodResolver(driverSchema),
    defaultValues: {
      full_name: initialData?.full_name || "",
      phone: initialData?.phone || "",
      license_number: initialData?.license_number || "",
      license_expiry_date: initialData?.license_expiry_date || "",
      address: initialData?.address || "",
      joined_date: initialData?.joined_date || "",
    },
  });

  return (
    <form
      className="space-y-4"
      onSubmit={handleSubmit(async (values) => {
        const fd = new FormData();
        Object.entries(values).forEach(([k, v]) => v != null && fd.append(k, String(v)));
        const r = await upsertDriver(fd, initialData?.id);
        if (r?.error) toast.error(String(r.error));
        else {
          toast.success(initialData?.id ? "Driver updated" : "Driver created");
          if (onSuccess) onSuccess();
          else router.push("/dashboard/drivers");
        }
      })}
    >
      <div>
        <Label>Full name</Label>
        <Input {...register("full_name")} required />
      </div>
      <div>
        <Label>Phone</Label>
        <Input {...register("phone")} />
      </div>
      <div>
        <Label>License number</Label>
        <Input {...register("license_number")} />
      </div>
      <div>
        <Label>License expiry</Label>
        <Input type="date" {...register("license_expiry_date")} />
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
