# Transport Fleet & Driver Management System

Production-ready fleet management built with **Next.js 14 (App Router)**, **Supabase** (PostgreSQL + Auth + RLS), **Tailwind CSS**, and **shadcn/ui**.

## Features

- Multi-role auth (super admin, transporter admin, sub-admin, dispatcher, accountant, fleet manager)
- Trips lifecycle with business rules (BR-01–BR-10) enforced in DB + server actions
- Masters: branches, customers/vendors, drivers, vehicles
- Expenses, payments, rentals, reports, Tally CSV export
- Dashboard KPIs, charts, document expiry alerts
- Soft delete + recovery, audit logs, cron notifications

## Quick start

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Run `supabase/migrations/001_initial_schema.sql` in the SQL Editor.
3. Run `supabase/migrations/002_erd_schema_alignment.sql` (adds ERD fields, `bills` table, see [docs/SCHEMA_MAPPING.md](docs/SCHEMA_MAPPING.md)).
4. Run `supabase/migrations/003_superadmin_platform.sql` (super admin company CRUD policies).
5. Enable **Email** auth provider.
6. Seed demo data (creates super admin + tenants + fleet sample data):

```bash
npm run db:seed
```

See [supabase/SEED.md](supabase/SEED.md) for login emails and passwords.

### Super admin (after seed)

| Email | Password | Panel |
|-------|----------|--------|
| `platform@fleetcontrol.demo` | `Demo@12345` | `/platform` |

Open **Raksha Logistics** → **Open workspace** for a populated fleet dashboard.

**Schema reference:** [Fleet_ERD_Schema.docx](Fleet_ERD_Schema.docx) (source) · [docs/Fleet_ERD_Schema.md](docs/Fleet_ERD_Schema.md) (text) · [docs/SCHEMA_MAPPING.md](docs/SCHEMA_MAPPING.md) (ERD → code names).

### 2. Environment

Copy `.env.example` to `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
CRON_SECRET=your-long-random-secret
```

### 3. Install & run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in.

### 4. Cron (Vercel)

`vercel.json` schedules `/api/cron/check-expiries` daily. Set `CRON_SECRET` and send:

```
Authorization: Bearer <CRON_SECRET>
```

## Project structure

```
app/
  dashboard/          # All module pages
  login/
  api/cron/           # Expiry notifications
  api/export/         # Excel/PDF exports
  api/tally/          # Tally CSV
actions/              # Server Actions
components/           # UI, layout, forms, charts
lib/                  # Supabase, auth, validations, exports
supabase/migrations/  # PostgreSQL schema + RLS
types/                # TypeScript types
middleware.ts         # Route protection
```

## Roles & modules

| Role | Access |
|------|--------|
| super_admin | Platform panel at `/platform`; fleet dashboard via tenant cookie after selecting a company |
| transporter_admin | Full company access |
| sub_admin | Per-module permissions in `user_module_permissions` |
| dispatcher | Trips, drivers, vehicles, expenses |
| accountant | Payments, expenses, reports, Tally, parties |
| fleet_manager | Vehicles, drivers, reports |

## Business rules

Enforced via PostgreSQL triggers and server actions:

- No duplicate driver/vehicle on active trips
- Vehicle must be `available` on trip create
- Expenses only on active trips
- Completed trips require valid odometer readings
- Soft deletes with 90-day retention (configurable on `companies.retention_days`)

## Build

```bash
npm run build
```

## License

Private / demo use.
