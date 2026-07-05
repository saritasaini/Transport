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
import { Camera, FileCheck2, Loader2 } from "lucide-react";

interface PodUploadFormProps {
  tripId: string;
  onSuccess?: () => void;
}

export function PodUploadForm({ tripId, onSuccess }: PodUploadFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate upload delay for demo
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsSubmitting(false);
    setIsOpen(false);
    if (onSuccess) onSuccess();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="w-full flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white">
          <FileCheck2 className="w-4 h-4" />
          Upload POD (Delivery Proof)
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md w-[90vw] rounded-xl">
        <DialogHeader>
          <DialogTitle>Upload Proof of Delivery</DialogTitle>
          <DialogDescription>
            Take a clear picture of the signed Bilty/LR document from the customer.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="border-2 border-dashed border-blue-200 bg-blue-50 rounded-xl p-8 flex flex-col items-center justify-center text-blue-600 hover:bg-blue-100 cursor-pointer transition-colors">
            <Camera className="w-12 h-12 mb-3" />
            <span className="text-base font-semibold">Open Camera</span>
            <span className="text-xs text-blue-500 mt-1">Make sure signature is visible</span>
            <input type="file" id="pod" className="hidden" accept="image/*" capture="environment" required />
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading POD...
              </>
            ) : (
              "Complete Upload"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
