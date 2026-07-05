"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { partySchema } from "@/lib/validations/master";
import { z } from "zod";
import { upsertParty } from "@/actions/masters";
import { PageHeader } from "@/components/shared/page-header";
import { SectionPanel } from "@/components/shared/section-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NewPartyPage() {
  const router = useRouter();
  const { register, handleSubmit, setValue, formState: { isSubmitting, errors } } = useForm<z.infer<typeof partySchema>>({
    resolver: zodResolver(partySchema),
    defaultValues: { type: "customer" }
  });

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <PageHeader 
        title="Add Party" 
        description="Register a new customer or vendor"
        action={
          <Link href="/dashboard/parties">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
        }
      />
      <SectionPanel title="Party details">
        <form
          className="space-y-4"
          onSubmit={handleSubmit(async (values) => {
            const fd = new FormData();
            Object.entries(values).forEach(([k, v]) => v && fd.append(k, String(v)));
            const r = await upsertParty(fd);
            if (r?.error) toast.error(String(r.error));
            else {
              toast.success("Party created successfully");
              router.push("/dashboard/parties");
            }
          })}
        >
          <div>
            <Label>Type</Label>
            <Select defaultValue="customer" onValueChange={(v) => setValue("type", v as "customer" | "vendor")}>
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
          <Button type="submit" disabled={isSubmitting}>Save</Button>
        </form>
      </SectionPanel>
    </div>
  );
}
