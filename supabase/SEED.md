# Demo seed data

## Quick start (recommended)

1. Run migrations `001`, `002`, and `003` in Supabase SQL Editor.
2. Set `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` (Project Settings → API).
3. Run:

```bash
npm run db:seed
```

This creates Auth users, profiles, two companies, and sample fleet data.

## Demo logins

| Email | Password | Role | Where to go |
|-------|------------|------|-------------|
| `platform@fleetcontrol.demo` | `Demo@12345` | super_admin | `/platform` |
| `admin@rakshalogistics.demo` | `Demo@12345` | transporter_admin | `/dashboard` (Raksha tenant) |
| `dispatcher@rakshalogistics.demo` | `Demo@12345` | dispatcher | `/dashboard` |
| `accountant@rakshalogistics.demo` | `Demo@12345` | accountant | `/dashboard` |
| `admin@swiftcargo.demo` | `Demo@12345` | transporter_admin | `/dashboard` (Swift tenant) |

**Super admin:** sign in → `/platform` → Companies → **Raksha Logistics Pvt Ltd** → **Open workspace** → `/dashboard` with full demo KPIs.

## What gets seeded

### Platform

- **Super admin** user (`company_id` = NULL)

### Tenants

1. **Raksha Logistics Pvt Ltd** (Pro plan, Mumbai/Pune)
   - 2 branches, 2 customers, 1 vendor
   - 3 drivers, 4 vehicles (one in maintenance, one with insurance expiring in 7 days)
   - 5 trips (pending, assigned, in_transit, completed, pending)
   - Trip expenses, payments, notifications

2. **Swift Cargo Lines** (Starter plan, Pune) — company only; add fleet data via UI or extend script

### Fixed UUIDs

See `scripts/seed-demo.mjs` (`IDS` object) if you need stable references in SQL or tests.

## Manual SQL only

If you cannot use the service role key, create users in **Authentication → Users**, then run the profile inserts from `seed.sql` with your Auth UUIDs.

## Re-run seed

The script upserts by id/email. Safe to run again; it resets demo passwords to `Demo@12345`.

## Production warning

Do not run `db:seed` in production. Demo passwords are public.
