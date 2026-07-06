import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth/session";
import { exportToExcel } from "@/lib/exports/excel";
import { exportTableToPdf } from "@/lib/exports/pdf";
import { formatDateIN, formatCurrencyINR } from "@/lib/utils/format";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ type: string }> }
) {
  const { type } = await params;
  const ctx = await getSessionContext();
  if (!ctx?.effectiveCompanyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") ?? "xlsx";
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const supabase = await createClient();
  let rows: Record<string, any>[] = [];
  let title = "Report";

  switch (type) {
    case "driver":
      const { data: drivers } = await supabase
        .from("drivers")
        .select("*")
        .eq("company_id", ctx.effectiveCompanyId)
        .is("deleted_at", null);
      rows = (drivers ?? []).map((d) => ({
        "Name": d.full_name,
        "Phone": d.phone ?? "-",
        "License": d.license_number ?? "-",
        "Status": d.is_active ? "Active" : "Inactive",
      }));
      title = "Driver Report";
      break;

    case "vehicle":
      const { data: vehicles } = await supabase
        .from("vehicles")
        .select("*")
        .eq("company_id", ctx.effectiveCompanyId)
        .is("deleted_at", null);
      rows = (vehicles ?? []).map((v) => ({
        "Registration": v.registration_number,
        "Type": v.vehicle_type ?? "-",
        "Status": v.current_status,
        "Odometer": v.last_odometer_reading,
      }));
      title = "Vehicle Report";
      break;

    case "expense":
      let expQuery = supabase
        .from("trip_expenses")
        .select("*, trip:trips(trip_number)")
        .eq("company_id", ctx.effectiveCompanyId)
        .is("deleted_at", null);
      if (from) expQuery = expQuery.gte("expense_date", from);
      if (to) expQuery = expQuery.lte("expense_date", to);

      const { data: expenses } = await expQuery;
      rows = (expenses ?? []).map((e) => ({
        "Date": formatDateIN(e.expense_date),
        "Trip": e.trip?.trip_number ?? "-",
        "Category": e.category,
        "Amount": formatCurrencyINR(e.amount),
        "Description": e.description ?? "-",
      }));
      title = "Expense Report";
      break;

    case "financial":
      let finQuery = supabase
        .from("trips")
        .select("*, trip_expenses(amount)")
        .eq("company_id", ctx.effectiveCompanyId)
        .is("deleted_at", null);
      if (from) finQuery = finQuery.gte("trip_date", from);
      if (to) finQuery = finQuery.lte("trip_date", to);

      const { data: fTrips } = await finQuery;
      rows = (fTrips ?? []).map((t) => {
        const income = t.freight_amount ?? t.bill_amount ?? 0;
        const totalExpenses = (t.trip_expenses ?? []).reduce((acc: number, e: any) => acc + Number(e.amount), 0);
        return {
          "Trip #": t.trip_number,
          "Date": formatDateIN(t.trip_date),
          "Income": formatCurrencyINR(income),
          "Expenses": formatCurrencyINR(totalExpenses),
          "Net Profit": formatCurrencyINR(income - totalExpenses),
        };
      });
      title = "Financial P&L Report";
      break;

    case "settlement":
      let billQuery = supabase
        .from("bills")
        .select("*, customer:customers_parties(name), trip:trips(trip_number)")
        .eq("company_id", ctx.effectiveCompanyId)
        .is("deleted_at", null);
      if (from) billQuery = billQuery.gte("bill_date", from);
      if (to) billQuery = billQuery.lte("bill_date", to);

      const { data: bills } = await billQuery;
      rows = (bills ?? []).map((b) => ({
        "Bill No": b.bill_no,
        "Customer": b.customer?.name ?? "-",
        "Trip #": b.trip?.trip_number ?? "-",
        "Total Amount": formatCurrencyINR(b.total_amount),
        "Paid": formatCurrencyINR(b.paid_amount),
        "Status": b.status,
      }));
      title = "Bill Settlement Report";
      break;

    case "trips":
    default:
      let tripQuery = supabase
        .from("trips")
        .select("trip_number, status, trip_date, origin, destination, bill_amount, payment_status")
        .eq("company_id", ctx.effectiveCompanyId)
        .is("deleted_at", null);
      if (from) tripQuery = tripQuery.gte("trip_date", from);
      if (to) tripQuery = tripQuery.lte("trip_date", to);

      const { data: trips } = await tripQuery;
      rows = (trips ?? []).map((t) => ({
        "Trip #": t.trip_number,
        "Status": t.status,
        "Date": formatDateIN(t.trip_date),
        "Origin": t.origin,
        "Destination": t.destination,
        "Bill": formatCurrencyINR(t.bill_amount),
        "Payment": t.payment_status,
      }));
      title = "Trips Report";
      break;
  }

  if (rows.length === 0) {
    rows = [{ Message: "No data available" }];
  }

  if (format === "pdf") {
    const buffer = exportTableToPdf(
      title,
      Object.keys(rows[0] ?? {}),
      rows.map((r) => Object.values(r)),
      `${type}.pdf`
    );
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${type}.pdf"`,
      },
    });
  }

  const buffer = exportToExcel(rows, title, `${type}.xlsx`);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${type}.xlsx"`,
    },
  });
}
