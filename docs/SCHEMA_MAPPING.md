# ERD document → implementation mapping

The [Fleet_ERD_Schema.docx](../Fleet_ERD_Schema.docx) uses **organizations** / **org_id** naming. This codebase keeps **`companies`** / **`company_id`** (Supabase + Next.js) to avoid breaking the app. Semantics are identical: one row per transport company (tenant).

| ERD table / column | Implemented as |
|--------------------|----------------|
| `organizations` | `companies` |
| `org_id` | `company_id` |
| `customers` | `customers_parties` |
| `gstin` (customer) | `gst_number` |
| `trip_no` | `trip_number` |
| `reg_no` | `registration_number` |
| `rent_contracts` | `rent_in_rent_out` (extended in migration 002) |
| `users.id` + auth | `users.id` → `auth.users` (Supabase Auth, not local password_hash) |
| `is_deleted` (ERD) | `deleted_at` TIMESTAMPTZ (soft delete) or `is_deleted` where added in 002 |

## Stack note

ERD specifies **PostgreSQL + NestJS**. This project uses **PostgreSQL (Supabase) + Next.js App Router**. Schema and business rules (BR-01–BR-10) align; only the API layer differs.

## Migration

Run `supabase/migrations/002_erd_schema_alignment.sql` after `001_initial_schema.sql` to add ERD fields, the **`bills`** table, and payment linkage.
