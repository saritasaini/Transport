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
    .from("trips")
    .select("trip_number, trip_date, bill_amount, customer:customers_parties(name)")
    .eq("company_id", ctx.effectiveCompanyId)
    .eq("status", "completed")
    .is("deleted_at", null);

  const header = "Date,Voucher,Trip,Party,Amount\n";
  const lines = (data ?? []).map((t) => {
    const customer = t.customer as { name?: string } | null;
    return `${t.trip_date},Sales,${t.trip_number},"${customer?.name ?? ""}",${t.bill_amount}`;
  });

  return new NextResponse(header + lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="tally-sales.csv"',
    },
  });
}
