-- Manual seed (SQL only) — use when you cannot run npm run db:seed
-- 1. Create users in Supabase Auth → Authentication → Users
-- 2. Replace placeholders below with auth.users.id values
-- 3. Run in SQL Editor AFTER migrations 001, 002, 003

-- ============ CONFIG: paste Auth user UUIDs from Supabase ============
-- Super admin (company_id must be NULL)
-- \set super_admin_id 'PASTE-SUPER-ADMIN-AUTH-UUID'

-- Tenant admin for Raksha Logistics
-- \set raksha_admin_id 'PASTE-RAKSHA-ADMIN-AUTH-UUID'

-- ============ Companies (fixed IDs match seed-demo.mjs) ============

INSERT INTO companies (id, name, email, phone, address, plan, gstin, retention_days, is_active)
VALUES
  (
    'a0000000-0000-4000-8000-000000000001',
    'Raksha Logistics Pvt Ltd',
    'ops@rakshalogistics.demo',
    '+91 98765 43210',
    'Andheri East, Mumbai, MH',
    'pro',
    '27AABCR1234F1Z5',
    90,
    true
  ),
  (
    'a0000000-0000-4000-8000-000000000002',
    'Swift Cargo Lines',
    'contact@swiftcargo.demo',
    '+91 91234 56789',
    'Hinjewadi, Pune, MH',
    'starter',
    '27AABCS5678G1Z9',
    90,
    true
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  plan = EXCLUDED.plan,
  is_active = EXCLUDED.is_active;

-- ============ Users (profiles linked to auth.users) ============
-- Uncomment and set UUIDs after creating Auth users:

/*
INSERT INTO users (id, company_id, full_name, role, is_active) VALUES
  ('PASTE-SUPER-ADMIN-AUTH-UUID', NULL, 'Platform Super Admin', 'super_admin', true),
  ('PASTE-RAKSHA-ADMIN-AUTH-UUID', 'a0000000-0000-4000-8000-000000000001', 'Rajesh Kumar', 'transporter_admin', true)
ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role, company_id = EXCLUDED.company_id;
*/

-- For full demo data (drivers, vehicles, trips, etc.) run:
--   npm run db:seed
