"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { driverSchema } from "@/lib/validations/master";
import { upsertDriver } from "@/actions/masters";
import { PageHeader } from "@/components/shared/page-header";
import { SectionPanel } from "@/components/shared/section-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function NewDriverPage() {
  const router = useRouter();
  const { register, handleSubmit, formState: { isSubmitting } } = useForm({
    resolver: zodResolver(driverSchema),
  });

  return (
    <div>
      <PageHeader title="Add driver" description="Register a new driver for trip assignment" />
      <SectionPanel title="Driver details">
        <form
          className="max-w-2xl space-y-4"
        onSubmit={handleSubmit(async (values) => {
          const fd = new FormData();
          Object.entries(values).forEach(([k, v]) => v && fd.append(k, String(v)));
          const r = await upsertDriver(fd);
          if (r?.error) toast.error(String(r.error));
          else {
            toast.success("Driver created");
            router.push("/dashboard/drivers");
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
        <Button type="submit" disabled={isSubmitting}>Save</Button>
      </form>
      </SectionPanel>
    </div>
  );
}
