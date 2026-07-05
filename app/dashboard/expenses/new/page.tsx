import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Receipt } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NewExpensePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Add Expense"
        description="Record a new expense for your fleet operations."
      />
      <EmptyState
        icon={Receipt}
        title="Under Construction"
        description="The Add Expense form is scheduled for implementation in an upcoming phase."
        action={
          <Button asChild>
            <Link href="/dashboard/expenses">Back to Expenses</Link>
          </Button>
        }
      />
    </div>
  );
}
