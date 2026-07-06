"use client";

import { PageHeader } from "@/components/shared/page-header";
import { SectionPanel } from "@/components/shared/section-panel";
import { PartyForm } from "@/components/parties/party-form";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NewPartyPage() {
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
        <PartyForm />
      </SectionPanel>
    </div>
  );
}
