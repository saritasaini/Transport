import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const in7Days = new Date();
  in7Days.setDate(in7Days.getDate() + 7);
  const cutoff = in7Days.toISOString().slice(0, 10);

  const { data: vehicles } = await supabase
    .from("vehicles")
    .select("*")
    .is("deleted_at", null)
    .or(
      `insurance_expiry.lte.${cutoff},fitness_expiry.lte.${cutoff},permit_expiry.lte.${cutoff}`
    );

  for (const v of vehicles ?? []) {
    const checks = [
      { field: "insurance_expiry", notified: "insurance_notified_at", label: "Insurance" },
      { field: "fitness_expiry", notified: "fitness_notified_at", label: "Fitness" },
      { field: "permit_expiry", notified: "permit_notified_at", label: "Permit" },
    ] as const;

    for (const c of checks) {
      const expiry = v[c.field as keyof typeof v] as string | null;
      const notified = v[c.notified as keyof typeof v];
      if (expiry && expiry <= cutoff && !notified) {
        await supabase.from("notifications").insert({
          company_id: v.company_id,
          type: "document_expiry",
          title: `${c.label} expiring soon`,
          message: `Vehicle ${v.registration_number} ${c.label} expires on ${expiry}`,
          related_entity_type: "vehicle",
          related_entity_id: v.id,
        });
        await supabase
          .from("vehicles")
          .update({ [c.notified]: new Date().toISOString() })
          .eq("id", v.id);
      }
    }
  }

  const { data: drivers } = await supabase
    .from("drivers")
    .select("*")
    .is("deleted_at", null)
    .lte("license_expiry_date", cutoff)
    .is("license_expiry_notified_at", null);

  for (const d of drivers ?? []) {
    await supabase.from("notifications").insert({
      company_id: d.company_id,
      type: "license_expiry",
      title: "Driver license expiring",
      message: `${d.full_name} license expires on ${d.license_expiry_date}`,
      related_entity_type: "driver",
      related_entity_id: d.id,
    });
    await supabase
      .from("drivers")
      .update({ license_expiry_notified_at: new Date().toISOString() })
      .eq("id", d.id);
  }

  return NextResponse.json({
    ok: true,
    vehiclesChecked: vehicles?.length ?? 0,
    driversNotified: drivers?.length ?? 0,
  });
}
