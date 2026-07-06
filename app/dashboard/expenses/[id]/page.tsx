import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth/session";
import { PageHeader } from "@/components/shared/page-header";
import { SectionPanel } from "@/components/shared/section-panel";
import { ExpenseForm } from "@/components/expenses/expense-form";

export default async function EditExpensePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await getSessionContext();
  const supabase = await createClient();

  const [expenseRes, tripsRes] = await Promise.all([
    supabase
      .from("trip_expenses")
      .select("*")
      .eq("id", id)
      .eq("company_id", ctx!.effectiveCompanyId!)
      .single(),
    supabase
      .from("trips")
      .select("id, trip_number")
      .eq("company_id", ctx!.effectiveCompanyId!)
      .is("deleted_at", null)
      .order("trip_number", { ascending: false }),
  ]);

  if (expenseRes.error || !expenseRes.data) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit Expense"
        description="Update expense details for your fleet operations."
      />
      <SectionPanel title="Expense details">
        <ExpenseForm initialData={expenseRes.data} trips={tripsRes.data || []} />
      </SectionPanel>
    </div>
  );
}
