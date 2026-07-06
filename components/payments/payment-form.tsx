"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { paymentSchema } from "@/lib/validations/master";
import { z } from "zod";
import { upsertPayment } from "@/actions/finance";
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

type PaymentFormValues = z.infer<typeof paymentSchema>;

interface PaymentFormProps {
  initialData?: Partial<PaymentFormValues> & { id?: string };
  trips: { id: string; trip_number: string; customer_id: string }[];
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function PaymentForm({ initialData, trips, onSuccess, onCancel }: PaymentFormProps) {
  const router = useRouter();
  const { register, handleSubmit, setValue, watch, formState: { isSubmitting } } = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      trip_id: initialData?.trip_id || "",
      customer_id: initialData?.customer_id || (initialData?.trip_id ? trips.find(t => t.id === initialData.trip_id)?.customer_id : "") || "",
      amount: initialData?.amount || 0,
      tds_deducted: initialData?.tds_deducted || "",
      net_received: initialData?.net_received || "",
      payment_mode: initialData?.payment_mode || "bank_transfer",
      payment_date: initialData?.payment_date || new Date().toISOString().split("T")[0],
      reference_note: initialData?.reference_note || "",
    },
  });

  const selectedTripId = watch("trip_id");

  return (
    <form
      className="max-w-2xl space-y-4"
      onSubmit={handleSubmit(async (values) => {
        const fd = new FormData();
        Object.entries(values).forEach(([k, v]) => v != null && fd.append(k, String(v)));
        const r = await upsertPayment(fd, initialData?.id);
        if (r?.error) toast.error(String(r.error));
        else {
          toast.success(initialData?.id ? "Payment updated" : "Payment recorded");
          if (onSuccess) onSuccess();
          else {
            router.push("/dashboard/payments");
            router.refresh();
          }
        }
      })}
    >
      <div>
        <Label>Trip</Label>
        <Select 
          defaultValue={initialData?.trip_id} 
          onValueChange={(v) => {
            setValue("trip_id", v);
            const trip = trips.find(t => t.id === v);
            if (trip) setValue("customer_id", trip.customer_id);
          }}
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
        <Label>Payment Mode</Label>
        <Select 
          defaultValue={initialData?.payment_mode || "bank_transfer"} 
          onValueChange={(v) => setValue("payment_mode", v as any)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select payment mode" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
            <SelectItem value="upi">UPI</SelectItem>
            <SelectItem value="neft">NEFT</SelectItem>
            <SelectItem value="rtgs">RTGS</SelectItem>
            <SelectItem value="cheque">Cheque</SelectItem>
            <SelectItem value="cash">Cash</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <Label>Amount (₹)</Label>
          <Input type="number" step="0.01" {...register("amount")} required />
        </div>
        <div>
          <Label>TDS Deducted (₹)</Label>
          <Input type="number" step="0.01" {...register("tds_deducted")} />
        </div>
        <div>
          <Label>Net Received (₹)</Label>
          <Input type="number" step="0.01" {...register("net_received")} />
        </div>
      </div>
      <div>
        <Label>Payment Date</Label>
        <Input type="date" {...register("payment_date")} required />
      </div>
      <div>
        <Label>Reference Note</Label>
        <Textarea {...register("reference_note")} placeholder="Transaction ID, Cheque No. etc." />
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save Payment"}
        </Button>
      </div>
    </form>
  );
}
