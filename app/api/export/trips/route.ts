import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth/session";
import { exportToExcel } from "@/lib/exports/excel";
import { exportTableToPdf } from "@/lib/exports/pdf";
import { formatDateIN, formatCurrencyINR } from "@/lib/utils/format";

export async function GET(request: Request) {
  const ctx = await getSessionContext();
  if (!ctx?.effectiveCompanyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") ?? "xlsx";

  const supabase = await createClient();
  const { data: trips } = await supabase
    .from("trips")
    .select("trip_number, status, trip_date, origin, destination, bill_amount, payment_status")
    .eq("company_id", ctx.effectiveCompanyId)
    .is("deleted_at", null);

  const rows = (trips ?? []).map((t) => ({
    "Trip #": t.trip_number,
    Status: t.status,
    Date: formatDateIN(t.trip_date),
    Origin: t.origin,
    Destination: t.destination,
    Bill: formatCurrencyINR(t.bill_amount),
    Payment: t.payment_status,
  }));

  if (format === "pdf") {
    const buffer = exportTableToPdf(
      "Trips Report",
      Object.keys(rows[0] ?? {}),
      rows.map((r) => Object.values(r)),
      "trips.pdf"
    );
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="trips.pdf"',
      },
    });
  }

  const buffer = exportToExcel(rows, "Trips", "trips.xlsx");
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="trips.xlsx"',
    },
  });
}
