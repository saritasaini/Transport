import { PageHeader } from "@/components/shared/page-header";
import { SectionPanel } from "@/components/shared/section-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";

export default function NewChallanPage() {
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <PageHeader 
        title="Add Traffic Challan" 
        description="Record a new traffic fine or challan for a vehicle" 
        action={
          <Link href="/dashboard/challans">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
        }
      />

      <SectionPanel title="Challan Details" contentClassName="p-6">
        <form className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="challan_no">Challan Number</Label>
              <Input id="challan_no" placeholder="e.g. MH992304..." required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="issue_date">Issue Date</Label>
              <Input id="issue_date" type="date" required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vehicle">Vehicle Registration</Label>
              <Input id="vehicle" placeholder="Vehicle No" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="driver">Driver Name</Label>
              <Input id="driver" placeholder="Driver Name" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Fine Amount (₹)</Label>
              <Input id="amount" type="number" placeholder="0.00" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select 
                id="status" 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="contested">Contested</option>
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <Checkbox id="deduct" defaultChecked />
            <div className="grid gap-1.5 leading-none">
              <label
                htmlFor="deduct"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Deduct from Driver
              </label>
              <p className="text-sm text-muted-foreground">
                Mark this fine to be deducted from the driver's next settlement
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
            <Link href="/dashboard/challans">
              <Button type="button" variant="ghost">Cancel</Button>
            </Link>
            <Button type="button">
              <Save className="w-4 h-4 mr-2" />
              Save Challan
            </Button>
          </div>
        </form>
      </SectionPanel>
    </div>
  );
}
