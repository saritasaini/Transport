import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth/session";

export async function GET() {
  const ctx = await getSessionContext();
  if (!ctx?.effectiveCompanyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("trip_expenses")
    .select("expense_date, category, amount, description, trip:trips(trip_number)")
    .eq("company_id", ctx.effectiveCompanyId)
    .is("deleted_at", null);

  const header = "Date,Ledger,Amount,Narration,Trip\n";
  const lines = (data ?? []).map((e) => {
    const trip = e.trip as { trip_number?: string } | null;
    return `${e.expense_date},${e.category},${e.amount},"${(e.description ?? "").replace(/"/g, '""')}",${trip?.trip_number ?? ""}`;
  });

  return new NextResponse(header + lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="tally-expenses.csv"',
    },
  });
}
