/**
 * Demo seed: super_admin + two tenant companies with fleet data.
 *
 * Requires .env.local with SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL
 *
 * Usage: npm run db:seed
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

const DEMO_PASSWORD = "Demo@12345";

const IDS = {
  companyRaksha: "a0000000-0000-4000-8000-000000000001",
  companySwift: "a0000000-0000-4000-8000-000000000002",
  branchMumbai: "b0000000-0000-4000-8000-000000000001",
  branchPune: "b0000000-0000-4000-8000-000000000002",
  branchSwift: "b0000000-0000-4000-8000-000000000003",
  customerAbc: "c0000000-0000-4000-8000-000000000001",
  customerXyz: "c0000000-0000-4000-8000-000000000002",
  customerVendorFuel: "c0000000-0000-4000-8000-000000000003",
  driver1: "d0000000-0000-4000-8000-000000000001",
  driver2: "d0000000-0000-4000-8000-000000000002",
  driver3: "d0000000-0000-4000-8000-000000000003",
  vehicle1: "e0000000-0000-4000-8000-000000000001",
  vehicle2: "e0000000-0000-4000-8000-000000000002",
  vehicle3: "e0000000-0000-4000-8000-000000000003",
  vehicle4: "e0000000-0000-4000-8000-000000000004",
  trip1: "f0000000-0000-4000-8000-000000000001",
  trip2: "f0000000-0000-4000-8000-000000000002",
  trip3: "f0000000-0000-4000-8000-000000000003",
  trip4: "f0000000-0000-4000-8000-000000000004",
  trip5: "f0000000-0000-4000-8000-000000000005",
};

const AUTH_USERS = [
  {
    email: "platform@fleetcontrol.demo",
    full_name: "Platform Super Admin",
    role: "super_admin",
    company_id: null,
  },
  {
    email: "admin@rakshalogistics.demo",
    full_name: "Rajesh Kumar",
    role: "transporter_admin",
    company_id: IDS.companyRaksha,
  },
  {
    email: "dispatcher@rakshalogistics.demo",
    full_name: "Priya Sharma",
    role: "dispatcher",
    company_id: IDS.companyRaksha,
  },
  {
    email: "accountant@rakshalogistics.demo",
    full_name: "Amit Patel",
    role: "accountant",
    company_id: IDS.companyRaksha,
  },
  {
    email: "admin@swiftcargo.demo",
    full_name: "Vikram Singh",
    role: "transporter_admin",
    company_id: IDS.companySwift,
  },
];

function loadEnv() {
  const envPath = resolve(process.cwd(), ".env.local");
  if (!existsSync(envPath)) {
    console.error("Missing .env.local — copy from .env.example");
    process.exit(1);
  }
  const lines = readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
  }
}

function assertServiceKey(key) {
  if (key.startsWith("sb_publishable_")) {
    console.error(
      "SUPABASE_SERVICE_ROLE_KEY looks like a publishable key (sb_publishable_...).\n" +
        "Swap it with NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local, or use the secret key\n" +
        "(sb_secret_...) / legacy service_role JWT from Supabase → Settings → API Keys."
    );
    process.exit(1);
  }
  if (!key.startsWith("eyJ") && !key.startsWith("sb_secret_")) {
    console.error(
      "SUPABASE_SERVICE_ROLE_KEY must be a secret key (sb_secret_...) or legacy service_role JWT (eyJ...).\n" +
        "Get it from Supabase Dashboard → Project Settings → API Keys."
    );
    process.exit(1);
  }
}

async function ensureAuthUser(supabase, { email, full_name, password }) {
  const { data: list } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const existing = list?.users?.find((u) => u.email === email);
  if (existing) {
    await supabase.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
      user_metadata: { full_name },
    });
    return existing.id;
  }
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name },
  });
  if (error) throw new Error(`Auth create ${email}: ${error.message}`);
  return data.user.id;
}

async function main() {
  loadEnv();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local");
    process.exit(1);
  }
  assertServiceKey(key);

  const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log("Seeding Fleet Control demo data...\n");

  const authIds = {};
  for (const u of AUTH_USERS) {
    authIds[u.email] = await ensureAuthUser(supabase, {
      email: u.email,
      full_name: u.full_name,
      password: DEMO_PASSWORD,
    });
  }

  const { error: cErr } = await supabase.from("companies").upsert(
    [
      {
        id: IDS.companyRaksha,
        name: "Raksha Logistics Pvt Ltd",
        email: "ops@rakshalogistics.demo",
        phone: "+91 98765 43210",
        address: "Andheri East, Mumbai, MH 400069",
        plan: "pro",
        gstin: "27AABCR1234F1Z5",
        retention_days: 90,
        is_active: true,
      },
      {
        id: IDS.companySwift,
        name: "Swift Cargo Lines",
        email: "contact@swiftcargo.demo",
        phone: "+91 91234 56789",
        address: "Hinjewadi, Pune, MH 411057",
        plan: "starter",
        gstin: "27AABCS5678G1Z9",
        retention_days: 90,
        is_active: true,
      },
    ],
    { onConflict: "id" }
  );
  if (cErr) throw cErr;

  const { error: bErr } = await supabase.from("branches").upsert(
    [
      {
        id: IDS.branchMumbai,
        company_id: IDS.companyRaksha,
        name: "Mumbai HQ",
        location: "Andheri East",
        city: "Mumbai",
        state: "Maharashtra",
        is_active: true,
      },
      {
        id: IDS.branchPune,
        company_id: IDS.companyRaksha,
        name: "Pune Depot",
        location: "Chakan MIDC",
        city: "Pune",
        state: "Maharashtra",
        is_active: true,
      },
      {
        id: IDS.branchSwift,
        company_id: IDS.companySwift,
        name: "Pune Office",
        location: "Hinjewadi",
        city: "Pune",
        state: "Maharashtra",
        is_active: true,
      },
    ],
    { onConflict: "id" }
  );
  if (bErr) throw bErr;

  const profiles = AUTH_USERS.map((u) => ({
    id: authIds[u.email],
    company_id: u.company_id,
    full_name: u.full_name,
    role: u.role,
    is_active: true,
    branch_id: u.company_id === IDS.companyRaksha ? IDS.branchMumbai : u.company_id === IDS.companySwift ? IDS.branchSwift : null,
  }));

  const { error: uErr } = await supabase.from("users").upsert(profiles, { onConflict: "id" });
  if (uErr) throw uErr;

  const adminRaksha = authIds["admin@rakshalogistics.demo"];
  const dispatcherRaksha = authIds["dispatcher@rakshalogistics.demo"];

  await supabase.from("customers_parties").upsert(
    [
      {
        id: IDS.customerAbc,
        company_id: IDS.companyRaksha,
        type: "customer",
        name: "ABC Manufacturing Ltd",
        contact_person: "Suresh Mehta",
        phone: "+91 90000 10001",
        email: "suresh@abcmanufacturing.demo",
        gst_number: "27AABCA1111A1Z1",
        credit_limit: 500000,
        outstanding_balance: 125000,
        payment_terms_days: 30,
        is_active: true,
      },
      {
        id: IDS.customerXyz,
        company_id: IDS.companyRaksha,
        type: "customer",
        name: "XYZ Retail Distributors",
        contact_person: "Neha Gupta",
        phone: "+91 90000 10002",
        gst_number: "27AABCX2222B1Z2",
        credit_limit: 300000,
        payment_terms_days: 15,
        is_active: true,
      },
      {
        id: IDS.customerVendorFuel,
        company_id: IDS.companyRaksha,
        type: "vendor",
        name: "Maharashtra Fuel Services",
        phone: "+91 90000 20001",
        is_active: true,
      },
    ],
    { onConflict: "id" }
  );

  await supabase.from("drivers").upsert(
    [
      {
        id: IDS.driver1,
        company_id: IDS.companyRaksha,
        full_name: "Ramesh Yadav",
        phone: "+91 98111 10001",
        license_number: "MH12 20190001234",
        license_expiry_date: "2027-06-15",
        availability_status: "available",
        joined_date: "2022-03-01",
        is_active: true,
      },
      {
        id: IDS.driver2,
        company_id: IDS.companyRaksha,
        full_name: "Sunil More",
        phone: "+91 98111 10002",
        license_number: "MH12 20180005678",
        license_expiry_date: "2026-04-20",
        availability_status: "available",
        joined_date: "2021-08-15",
        is_active: true,
      },
      {
        id: IDS.driver3,
        company_id: IDS.companyRaksha,
        full_name: "Anil Jadhav",
        phone: "+91 98111 10003",
        license_number: "MH14 20200009012",
        license_expiry_date: "2028-11-30",
        availability_status: "available",
        joined_date: "2023-01-10",
        is_active: true,
      },
    ],
    { onConflict: "id" }
  );

  const in30 = new Date();
  in30.setDate(in30.getDate() + 30);
  const in7 = new Date();
  in7.setDate(in7.getDate() + 7);

  await supabase.from("vehicles").upsert(
    [
      {
        id: IDS.vehicle1,
        company_id: IDS.companyRaksha,
        registration_number: "MH12 AB 1234",
        category: "owned",
        vehicle_type: "Truck 32ft",
        model: "Tata 4018",
        base_branch_id: IDS.branchMumbai,
        branch_id: IDS.branchMumbai,
        current_status: "available",
        insurance_expiry: in30.toISOString().slice(0, 10),
        fitness_expiry: in30.toISOString().slice(0, 10),
        permit_expiry: in30.toISOString().slice(0, 10),
        last_odometer_reading: 45200,
        is_active: true,
      },
      {
        id: IDS.vehicle2,
        company_id: IDS.companyRaksha,
        registration_number: "MH12 CD 5678",
        category: "owned",
        vehicle_type: "Container",
        model: "Ashok Leyland 5525",
        base_branch_id: IDS.branchMumbai,
        branch_id: IDS.branchMumbai,
        current_status: "available",
        insurance_expiry: in7.toISOString().slice(0, 10),
        fitness_expiry: in30.toISOString().slice(0, 10),
        permit_expiry: in30.toISOString().slice(0, 10),
        last_odometer_reading: 78500,
        is_active: true,
      },
      {
        id: IDS.vehicle3,
        company_id: IDS.companyRaksha,
        registration_number: "MH14 EF 9012",
        category: "owned",
        vehicle_type: "LCV",
        model: "Eicher Pro 2110",
        base_branch_id: IDS.branchPune,
        branch_id: IDS.branchPune,
        current_status: "available",
        insurance_expiry: in30.toISOString().slice(0, 10),
        fitness_expiry: in30.toISOString().slice(0, 10),
        permit_expiry: in30.toISOString().slice(0, 10),
        last_odometer_reading: 32100,
        is_active: true,
      },
      {
        id: IDS.vehicle4,
        company_id: IDS.companyRaksha,
        registration_number: "MH12 GH 3456",
        category: "leased",
        vehicle_type: "Truck 24ft",
        model: "Mahindra Blazo",
        base_branch_id: IDS.branchMumbai,
        current_status: "maintenance",
        insurance_expiry: in30.toISOString().slice(0, 10),
        fitness_expiry: in30.toISOString().slice(0, 10),
        permit_expiry: in30.toISOString().slice(0, 10),
        last_odometer_reading: 120400,
        is_active: true,
      },
    ],
    { onConflict: "id" }
  );

  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yStr = yesterday.toISOString().slice(0, 10);

  await supabase.from("trips").upsert(
    [
      {
        id: IDS.trip1,
        company_id: IDS.companyRaksha,
        trip_number: "TRP-SEED-0001",
        customer_id: IDS.customerAbc,
        branch_id: IDS.branchMumbai,
        origin: "Mumbai",
        destination: "Pune",
        start_location: "Andheri East Warehouse",
        fleet_origin: "Mumbai HQ",
        status: "pending",
        trip_date: today,
        bill_amount: 45000,
        payment_status: "unpaid",
        created_by: dispatcherRaksha,
        freight_amount: 45000,
      },
      {
        id: IDS.trip2,
        company_id: IDS.companyRaksha,
        trip_number: "TRP-SEED-0002",
        customer_id: IDS.customerXyz,
        driver_id: IDS.driver1,
        vehicle_id: IDS.vehicle1,
        branch_id: IDS.branchMumbai,
        origin: "Mumbai",
        destination: "Nashik",
        start_location: "Bhiwandi Hub",
        fleet_origin: "Mumbai HQ",
        status: "in_transit",
        trip_date: today,
        odometer_start: 45200,
        bill_amount: 28000,
        payment_status: "unpaid",
        created_by: dispatcherRaksha,
        freight_amount: 28000,
      },
      {
        id: IDS.trip3,
        company_id: IDS.companyRaksha,
        trip_number: "TRP-SEED-0003",
        customer_id: IDS.customerAbc,
        driver_id: IDS.driver2,
        vehicle_id: IDS.vehicle2,
        branch_id: IDS.branchMumbai,
        origin: "Mumbai",
        destination: "Ahmedabad",
        start_location: "JNPT Yard",
        fleet_origin: "Mumbai HQ",
        status: "assigned",
        trip_date: today,
        odometer_start: 78500,
        bill_amount: 62000,
        payment_status: "partially_paid",
        created_by: dispatcherRaksha,
        freight_amount: 62000,
      },
      {
        id: IDS.trip4,
        company_id: IDS.companyRaksha,
        trip_number: "TRP-SEED-0004",
        customer_id: IDS.customerXyz,
        driver_id: IDS.driver3,
        vehicle_id: IDS.vehicle3,
        branch_id: IDS.branchPune,
        origin: "Pune",
        destination: "Bangalore",
        start_location: "Chakan MIDC",
        fleet_origin: "Pune Depot",
        status: "completed",
        trip_date: yStr,
        odometer_start: 31800,
        odometer_end: 33150,
        bill_amount: 95000,
        payment_status: "paid",
        is_locked: true,
        created_by: dispatcherRaksha,
        freight_amount: 95000,
        completed_at: new Date().toISOString(),
      },
      {
        id: IDS.trip5,
        company_id: IDS.companyRaksha,
        trip_number: "TRP-SEED-0005",
        customer_id: IDS.customerAbc,
        branch_id: IDS.branchMumbai,
        origin: "Mumbai",
        destination: "Delhi",
        start_location: "Taloja ICD",
        fleet_origin: "Mumbai HQ",
        status: "pending",
        trip_date: today,
        bill_amount: 185000,
        payment_status: "unpaid",
        created_by: adminRaksha,
        freight_amount: 185000,
      },
    ],
    { onConflict: "id" }
  );

  await supabase.from("trip_expenses").upsert(
    [
      {
        id: "10000000-0000-4000-8000-000000000001",
        trip_id: IDS.trip2,
        company_id: IDS.companyRaksha,
        category: "fuel",
        amount: 8500,
        description: "Diesel en route Nashik",
        expense_date: today,
        created_by: dispatcherRaksha,
      },
      {
        id: "10000000-0000-4000-8000-000000000002",
        trip_id: IDS.trip2,
        company_id: IDS.companyRaksha,
        category: "toll",
        amount: 1200,
        expense_date: today,
        created_by: dispatcherRaksha,
      },
      {
        id: "10000000-0000-4000-8000-000000000003",
        trip_id: IDS.trip4,
        company_id: IDS.companyRaksha,
        category: "fuel",
        amount: 22000,
        expense_date: yStr,
        created_by: dispatcherRaksha,
      },
    ],
    { onConflict: "id" }
  );

  await supabase.from("payments").upsert(
    [
      {
        id: "20000000-0000-4000-8000-000000000001",
        trip_id: IDS.trip3,
        company_id: IDS.companyRaksha,
        customer_id: IDS.customerAbc,
        amount: 30000,
        payment_mode: "bank_transfer",
        payment_date: today,
        reference_note: "Advance UTR SEED001",
        created_by: authIds["accountant@rakshalogistics.demo"],
      },
      {
        id: "20000000-0000-4000-8000-000000000002",
        trip_id: IDS.trip4,
        company_id: IDS.companyRaksha,
        customer_id: IDS.customerXyz,
        amount: 95000,
        payment_mode: "neft",
        payment_date: yStr,
        reference_note: "Full settlement",
        created_by: authIds["accountant@rakshalogistics.demo"],
      },
    ],
    { onConflict: "id" }
  );

  await supabase.from("notifications").upsert(
    [
      {
        id: "30000000-0000-4000-8000-000000000001",
        company_id: IDS.companyRaksha,
        user_id: dispatcherRaksha,
        type: "document_expiry",
        title: "Insurance expiring soon",
        message: "Vehicle MH12 CD 5678 insurance expires within 7 days.",
        related_entity_type: "vehicle",
        related_entity_id: IDS.vehicle2,
        is_read: false,
      },
      {
        id: "30000000-0000-4000-8000-000000000002",
        company_id: IDS.companyRaksha,
        type: "trip_event",
        title: "Trip TRP-SEED-0004 completed",
        message: "Pune to Bangalore trip marked completed.",
        related_entity_type: "trip",
        related_entity_id: IDS.trip4,
        is_read: true,
      },
    ],
    { onConflict: "id" }
  );

  console.log("Seed complete.\n");
  console.log("=".repeat(60));
  console.log("LOGIN CREDENTIALS (password for all):", DEMO_PASSWORD);
  console.log("=".repeat(60));
  console.log("\nSuper admin (Platform /platform):");
  console.log("  Email: platform@fleetcontrol.demo");
  console.log("\nRaksha Logistics tenant (/dashboard after Open workspace):");
  console.log("  admin@rakshalogistics.demo      — transporter_admin");
  console.log("  dispatcher@rakshalogistics.demo — dispatcher");
  console.log("  accountant@rakshalogistics.demo — accountant");
  console.log("\nSwift Cargo tenant:");
  console.log("  admin@swiftcargo.demo           — transporter_admin");
  console.log("\nSuper admin flow:");
  console.log("  1. Sign in as platform@fleetcontrol.demo");
  console.log("  2. Open /platform → Companies → Raksha Logistics → Open workspace");
  console.log("  3. Fleet dashboard shows seeded trips, vehicles, KPIs");
  console.log("=".repeat(60));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
