"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Receipt, Camera, Loader2 } from "lucide-react";

interface ExpenseUploadFormProps {
  tripId: string;
  onSuccess?: () => void;
}

export function ExpenseUploadForm({ tripId, onSuccess }: ExpenseUploadFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate upload delay for demo
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setIsSubmitting(false);
    setIsOpen(false);
    if (onSuccess) onSuccess();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="w-full flex items-center gap-2" variant="outline">
          <Receipt className="w-4 h-4" />
          Add Expense
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md w-[90vw] rounded-xl">
        <DialogHeader>
          <DialogTitle>Record Trip Expense</DialogTitle>
          <DialogDescription>
            Add fuel, toll, or other expenses. Upload a picture of the receipt.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <select 
              id="category" 
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              required
            >
              <option value="fuel">Fuel / Diesel</option>
              <option value="toll">Toll Tax</option>
              <option value="food">Driver Food</option>
              <option value="maintenance">Maintenance</option>
              <option value="miscellaneous">Other</option>
            </select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (₹)</Label>
            <Input id="amount" type="number" placeholder="0.00" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="receipt">Receipt Photo</Label>
            <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 flex flex-col items-center justify-center text-slate-500 hover:bg-slate-50 cursor-pointer">
              <Camera className="w-8 h-8 mb-2" />
              <span className="text-sm font-medium">Tap to take photo</span>
              <input type="file" id="receipt" className="hidden" accept="image/*" capture="environment" />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              "Submit Expense"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
