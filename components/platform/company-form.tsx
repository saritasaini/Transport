"use client";

import { useRouter } from "next/navigation";
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
import { createCompany, updateCompany } from "@/actions/platform";
import type { Company } from "@/types/database";

export function CompanyForm({
  company,
}: {
  company?: Partial<Company>;
}) {
  const router = useRouter();
  const isEdit = !!company;

  return (
    <form
      className="max-w-xl space-y-4"
      action={async (formData) => {
        const result = isEdit && company?.id
          ? await updateCompany(company.id, formData)
          : await createCompany(formData);

        if (result?.error) {
          toast.error(String(result.error));
          return;
        }
        toast.success(isEdit ? "Company updated" : "Company created");
        if (!isEdit && result && "id" in result && result.id) {
          router.push(`/platform/companies/${result.id}`);
        } else {
          router.refresh();
        }
      }}
    >
      <div>
        <Label htmlFor="name">Company name</Label>
        <Input
          id="name"
          name="name"
          required
          defaultValue={company?.name}
          className="mt-1"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            defaultValue={company?.email ?? ""}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            name="phone"
            defaultValue={company?.phone ?? ""}
            className="mt-1"
          />
        </div>
      </div>
      <div>
        <Label htmlFor="address">Address</Label>
        <Input
          id="address"
          name="address"
          defaultValue={company?.address ?? ""}
          className="mt-1"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="plan">Plan</Label>
          <Select name="plan" defaultValue={company?.plan ?? "starter"}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="starter">Starter</SelectItem>
              <SelectItem value="pro">Pro</SelectItem>
              <SelectItem value="enterprise">Enterprise</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="gstin">GSTIN</Label>
          <Input
            id="gstin"
            name="gstin"
            defaultValue={company?.gstin ?? ""}
            className="mt-1"
          />
        </div>
      </div>
      <div>
        <Label htmlFor="retention_days">Retention days</Label>
        <Input
          id="retention_days"
          name="retention_days"
          type="number"
          min={1}
          max={365}
          defaultValue={company?.retention_days ?? 90}
          className="mt-1"
        />
      </div>
      <Button type="submit">{isEdit ? "Save changes" : "Create company"}</Button>
    </form>
  );
}
