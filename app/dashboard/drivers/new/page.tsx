"use client";

import { PageHeader } from "@/components/shared/page-header";
import { SectionPanel } from "@/components/shared/section-panel";
import { DriverForm } from "@/components/drivers/driver-form";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NewDriverPage() {
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <PageHeader 
        title="Add driver" 
        description="Register a new driver for trip assignment" 
        action={
          <Link href="/dashboard/drivers">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
        }
      />
      <SectionPanel title="Driver details">
        <DriverForm />
      </SectionPanel>
    </div>
  );
}
