"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { partySchema } from "@/lib/validations/master";
import { z } from "zod";
import { upsertParty } from "@/actions/masters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

type PartyFormValues = z.infer<typeof partySchema>;

interface PartyFormProps {
  initialData?: Partial<PartyFormValues> & { id?: string };
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function PartyForm({ initialData, onSuccess, onCancel }: PartyFormProps) {
  const router = useRouter();
  const { register, handleSubmit, setValue, formState: { isSubmitting, errors } } = useForm<PartyFormValues>({
    resolver: zodResolver(partySchema),
    defaultValues: {
      type: initialData?.type || "customer",
      name: initialData?.name || "",
      contact_person: initialData?.contact_person || "",
      phone: initialData?.phone || "",
      email: initialData?.email || "",
      gst_number: initialData?.gst_number || "",
      address: initialData?.address || "",
    }
  });

  return (
    <form
      className="space-y-4"
      onSubmit={handleSubmit(async (values) => {
        const fd = new FormData();
        Object.entries(values).forEach(([k, v]) => v && fd.append(k, String(v)));
        const r = await upsertParty(fd, initialData?.id);
        if (r?.error) toast.error(String(r.error));
        else {
          toast.success(initialData?.id ? "Party updated successfully" : "Party created successfully");
          if (onSuccess) onSuccess();
          else router.push("/dashboard/parties");
        }
      })}
    >
      <div>
        <Label>Type</Label>
        <Select defaultValue={initialData?.type || "customer"} onValueChange={(v) => setValue("type", v as "customer" | "vendor")}>
          <SelectTrigger>
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="customer">Customer</SelectItem>
            <SelectItem value="vendor">Vendor</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Name *</Label>
        <Input {...register("name")} required />
        {errors.name && <p className="text-sm text-destructive">{String(errors.name.message)}</p>}
      </div>
      <div>
        <Label>Contact Person</Label>
        <Input {...register("contact_person")} />
      </div>
      <div>
        <Label>Phone</Label>
        <Input {...register("phone")} />
      </div>
      <div>
        <Label>Email</Label>
        <Input type="email" {...register("email")} />
      </div>
      <div>
        <Label>GST Number</Label>
        <Input {...register("gst_number")} />
      </div>
      <div>
        <Label>Address</Label>
        <Input {...register("address")} />
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
