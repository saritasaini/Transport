"use client";

import { PageHeader } from "@/components/shared/page-header";
import { SectionPanel } from "@/components/shared/section-panel";
import { VehicleForm } from "@/components/vehicles/vehicle-form";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NewVehiclePage() {
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <PageHeader 
        title="Add vehicle" 
        description="Register a new fleet vehicle" 
        action={
          <Link href="/dashboard/vehicles">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
        }
      />
      <SectionPanel title="Vehicle details">
        <VehicleForm />
      </SectionPanel>
    </div>
  );
}
