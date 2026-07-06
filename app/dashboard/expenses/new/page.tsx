import { PageHeader } from "@/components/shared/page-header";
import { SectionPanel } from "@/components/shared/section-panel";
import { ExpenseForm } from "@/components/expenses/expense-form";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth/session";

export default async function NewExpensePage() {
  const ctx = await getSessionContext();
  const supabase = await createClient();
  
  const { data: trips } = await supabase
    .from("trips")
    .select("id, trip_number")
    .eq("company_id", ctx!.effectiveCompanyId!)
    .is("deleted_at", null)
    .not("status", "in", '("cancelled","completed")')
    .order("trip_number", { ascending: false });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Add Expense"
        description="Record a new expense for your fleet operations."
      />
      <SectionPanel title="Expense details">
        <ExpenseForm trips={trips || []} />
      </SectionPanel>
    </div>
  );
}
