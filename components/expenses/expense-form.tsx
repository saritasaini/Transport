"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { expenseSchema } from "@/lib/validations/master";
import { z } from "zod";
import { upsertExpense } from "@/actions/finance";
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import type { Trip } from "@/types/database";

type ExpenseFormValues = z.infer<typeof expenseSchema>;

interface ExpenseFormProps {
  initialData?: Partial<ExpenseFormValues> & { id?: string };
  trips: Pick<Trip, "id" | "trip_number">[];
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ExpenseForm({ initialData, trips, onSuccess, onCancel }: ExpenseFormProps) {
  const router = useRouter();
  const { register, handleSubmit, setValue, formState: { isSubmitting } } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      category: initialData?.category || "fuel",
      trip_id: initialData?.trip_id || "",
      amount: initialData?.amount || 0,
      description: initialData?.description || "",
      expense_date: initialData?.expense_date || new Date().toISOString().split("T")[0],
    },
  });

  return (
    <form
      className="max-w-2xl space-y-4"
      onSubmit={handleSubmit(async (values) => {
        const fd = new FormData();
        Object.entries(values).forEach(([k, v]) => v != null && fd.append(k, String(v)));
        const r = await upsertExpense(fd, initialData?.id);
        if (r?.error) toast.error(String(r.error));
        else {
          toast.success(initialData?.id ? "Expense updated" : "Expense recorded");
          if (onSuccess) onSuccess();
          else router.push("/dashboard/expenses");
        }
      })}
    >
      <div>
        <Label>Trip</Label>
        <Select 
          defaultValue={initialData?.trip_id} 
          onValueChange={(v) => setValue("trip_id", v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select trip" />
          </SelectTrigger>
          <SelectContent>
            {trips.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.trip_number}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Category</Label>
        <Select 
          defaultValue={initialData?.category || "fuel"} 
          onValueChange={(v) => setValue("category", v as any)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="fuel">Fuel</SelectItem>
            <SelectItem value="driver_allowance">Driver Allowance</SelectItem>
            <SelectItem value="toll">Toll</SelectItem>
            <SelectItem value="food">Food</SelectItem>
            <SelectItem value="parking">Parking</SelectItem>
            <SelectItem value="maintenance">Maintenance</SelectItem>
            <SelectItem value="miscellaneous">Miscellaneous</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Amount (₹)</Label>
        <Input type="number" step="0.01" {...register("amount")} required />
      </div>
      <div>
        <Label>Expense Date</Label>
        <Input type="date" {...register("expense_date")} required />
      </div>
      <div>
        <Label>Description</Label>
        <Textarea {...register("description")} />
      </div>
      <div className="flex justify-end space-x-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save Expense"}
        </Button>
      </div>
    </form>
  );
}
