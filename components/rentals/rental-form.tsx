"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { createRental, updateRental } from "@/actions/rentals";
import { Textarea } from "@/components/ui/textarea";

export function RentalForm({ 
  parties, 
  initialData,
  onSuccess,
  onCancel
}: { 
  parties: any[];
  initialData?: any;
  onSuccess?: () => void;
  onCancel?: () => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, setValue, watch } = useForm({
    defaultValues: {
      type: initialData?.type || "rent_in",
      vendor_id: initialData?.vendor_id || "",
      vehicle_number: initialData?.vehicle_number || "",
      vehicle_description: initialData?.vehicle_description || "",
      start_date: initialData?.start_date ? new Date(initialData.start_date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
      end_date: initialData?.end_date ? new Date(initialData.end_date).toISOString().slice(0, 10) : "",
      agreed_rate: initialData?.agreed_rate || "",
      rate_unit: initialData?.rate_unit || "per_day",
      total_amount: initialData?.total_amount || "",
      notes: initialData?.notes || "",
    }
  });

  const onSubmit = async (data: any) => {
    setLoading(true);
    const res = initialData?.id 
      ? await updateRental(initialData.id, data) 
      : await createRental(data);
      
    if (res.success) {
      if (onSuccess) onSuccess();
      else router.push("/dashboard/rentals");
    } else {
      alert("Error: " + res.error);
      setLoading(false);
    }
  };

  const type = watch("type");

  const filteredParties = parties.filter(p => {
    if (type === "rent_in") return p.type === "vendor";
    if (type === "rent_out") return p.type === "customer";
    return true;
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card>
        <CardContent className="pt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Rental Type</Label>
              <Select value={type} onValueChange={(val) => setValue("type", val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rent_in">Rent In (Taking vehicle)</SelectItem>
                  <SelectItem value="rent_out">Rent Out (Giving vehicle)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{type === "rent_in" ? "Vendor (Owner)" : "Customer"}</Label>
              <Select onValueChange={(val) => setValue("vendor_id", val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select party" />
                </SelectTrigger>
                <SelectContent>
                  {filteredParties.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                  {filteredParties.length === 0 && (
                    <div className="p-2 text-sm text-muted-foreground text-center">No {type === "rent_in" ? "vendors" : "customers"} found</div>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Vehicle Number</Label>
              <Input placeholder="e.g. MH12AB1234" {...register("vehicle_number")} required />
            </div>

            <div className="space-y-2">
              <Label>Vehicle Description</Label>
              <Input placeholder="e.g. 10 Tyre Truck" {...register("vehicle_description")} />
            </div>

            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input type="date" {...register("start_date")} required />
            </div>

            <div className="space-y-2">
              <Label>End Date (Optional)</Label>
              <Input type="date" {...register("end_date")} />
            </div>

            <div className="space-y-2">
              <Label>Agreed Rate</Label>
              <Input type="number" placeholder="0.00" {...register("agreed_rate")} />
            </div>

            <div className="space-y-2">
              <Label>Rate Unit</Label>
              <Select value={watch("rate_unit")} onValueChange={(val) => setValue("rate_unit", val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="per_day">Per Day</SelectItem>
                  <SelectItem value="per_month">Per Month</SelectItem>
                  <SelectItem value="per_trip">Per Trip</SelectItem>
                  <SelectItem value="fixed">Fixed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Total Amount (Optional for now)</Label>
              <Input type="number" placeholder="0.00" {...register("total_amount")} />
            </div>

          </div>
          
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea placeholder="Any additional notes..." {...register("notes")} />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" type="button" onClick={() => {
              if (onCancel) onCancel();
              else router.back();
            }}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {initialData?.id ? "Save Changes" : "Save Rental"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
