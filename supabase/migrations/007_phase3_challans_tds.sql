-- Phase 3: Challans & TDS Tracking (India Compliance)

-- 1. Create challans table
CREATE TABLE IF NOT EXISTS challans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
  trip_id UUID REFERENCES trips(id) ON DELETE SET NULL,
  challan_no TEXT NOT NULL,
  amount NUMERIC(14, 2) NOT NULL CHECK (amount >= 0),
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, paid, contested
  deduct_from_driver BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_challans_vehicle ON challans(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_challans_company ON challans(company_id);

-- 2. Add TDS fields to payments table
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS tds_deducted NUMERIC(14, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS tds_certificate_no TEXT,
ADD COLUMN IF NOT EXISTS net_received NUMERIC(14, 2) DEFAULT 0;

-- Update existing payments to have net_received = amount if they don't have it
UPDATE payments SET net_received = amount WHERE net_received = 0 OR net_received IS NULL;
