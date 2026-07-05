-- Fleet ERD Schema alignment (v1.0 doc)
-- Additive migration: extends 001 without renaming companies → organizations.
-- See docs/SCHEMA_MAPPING.md for name mapping.

-- ---------------------------------------------------------------------------
-- companies (ERD: organizations)
-- ---------------------------------------------------------------------------
ALTER TABLE companies ADD COLUMN IF NOT EXISTS plan VARCHAR(50) NOT NULL DEFAULT 'starter';
ALTER TABLE companies ADD COLUMN IF NOT EXISTS gstin VARCHAR(20);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- ---------------------------------------------------------------------------
-- branches
-- ---------------------------------------------------------------------------
ALTER TABLE branches ADD COLUMN IF NOT EXISTS city VARCHAR(80);
ALTER TABLE branches ADD COLUMN IF NOT EXISTS state VARCHAR(80);
ALTER TABLE branches ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- ---------------------------------------------------------------------------
-- customers_parties (ERD: customers)
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  ALTER TYPE party_type ADD VALUE 'transporter';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE customers_parties ADD COLUMN IF NOT EXISTS credit_limit NUMERIC(12, 2) NOT NULL DEFAULT 0;
ALTER TABLE customers_parties ADD COLUMN IF NOT EXISTS outstanding_balance NUMERIC(12, 2) NOT NULL DEFAULT 0;
ALTER TABLE customers_parties ADD COLUMN IF NOT EXISTS payment_terms_days INTEGER NOT NULL DEFAULT 30;
ALTER TABLE customers_parties ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- ---------------------------------------------------------------------------
-- drivers
-- ---------------------------------------------------------------------------
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id) ON DELETE SET NULL;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS alt_phone VARCHAR(20);
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS license_type VARCHAR(30);
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- ---------------------------------------------------------------------------
-- vehicles
-- ---------------------------------------------------------------------------
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id) ON DELETE SET NULL;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS make VARCHAR(80);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS capacity_tons NUMERIC(6, 2);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS year_of_mfg INTEGER;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS insurance_no VARCHAR(80);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS permit_no VARCHAR(80);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS puc_expiry DATE;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Backfill branch_id from base_branch_id where present
UPDATE vehicles SET branch_id = base_branch_id WHERE branch_id IS NULL AND base_branch_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- trips
-- ---------------------------------------------------------------------------
ALTER TABLE trips ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS goods_type VARCHAR(100);
ALTER TABLE trips ADD COLUMN IF NOT EXISTS weight_tons NUMERIC(8, 2);
ALTER TABLE trips ADD COLUMN IF NOT EXISTS freight_amount NUMERIC(12, 2);
ALTER TABLE trips ADD COLUMN IF NOT EXISTS advance_paid NUMERIC(12, 2) NOT NULL DEFAULT 0;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS hold_reason TEXT;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS cancel_reason TEXT;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Sync freight_amount from bill_amount for existing rows
UPDATE trips SET freight_amount = bill_amount WHERE freight_amount IS NULL;

-- ---------------------------------------------------------------------------
-- trip_expenses
-- ---------------------------------------------------------------------------
ALTER TABLE trip_expenses ADD COLUMN IF NOT EXISTS receipt_url TEXT;

-- ---------------------------------------------------------------------------
-- bills (ERD: one bill per trip)
-- ---------------------------------------------------------------------------
CREATE TYPE bill_status AS ENUM ('unpaid', 'partial', 'paid', 'overdue', 'disputed');

CREATE TABLE IF NOT EXISTS bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers_parties(id),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  bill_no VARCHAR(30) NOT NULL,
  bill_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '30 days')::DATE,
  base_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  tax_percent NUMERIC(5, 2) NOT NULL DEFAULT 0,
  tax_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  paid_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  status bill_status NOT NULL DEFAULT 'unpaid',
  notes TEXT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, bill_no),
  UNIQUE (trip_id)
);

CREATE INDEX IF NOT EXISTS idx_bills_company_status ON bills(company_id, status);
CREATE INDEX IF NOT EXISTS idx_bills_customer ON bills(customer_id) WHERE deleted_at IS NULL;

-- ---------------------------------------------------------------------------
-- payments: link to bills (ERD) while keeping trip_id for legacy app
-- ---------------------------------------------------------------------------
ALTER TABLE payments ADD COLUMN IF NOT EXISTS bill_id UUID REFERENCES bills(id) ON DELETE SET NULL;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS reference_no VARCHAR(100);

DO $$ BEGIN ALTER TYPE payment_mode ADD VALUE 'upi';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE payment_mode ADD VALUE 'neft';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE payment_mode ADD VALUE 'rtgs';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------------------
-- rent_in_rent_out (ERD: rent_contracts)
-- ---------------------------------------------------------------------------
ALTER TABLE rent_in_rent_out ADD COLUMN IF NOT EXISTS vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL;
ALTER TABLE rent_in_rent_out ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE rent_in_rent_out ADD COLUMN IF NOT EXISTS rate_unit VARCHAR(20) DEFAULT 'per_day';
ALTER TABLE rent_in_rent_out ADD COLUMN IF NOT EXISTS return_date DATE;
ALTER TABLE rent_in_rent_out ADD COLUMN IF NOT EXISTS return_odometer INTEGER;
ALTER TABLE rent_in_rent_out ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- ---------------------------------------------------------------------------
-- audit_logs (ERD fields)
-- ---------------------------------------------------------------------------
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS changes JSONB;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS ip_address INET;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS user_agent TEXT;

-- ---------------------------------------------------------------------------
-- Bill number generation
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION generate_bill_number(p_company_id UUID)
RETURNS TEXT AS $$
DECLARE
  seq INT;
  ym TEXT;
BEGIN
  ym := to_char(CURRENT_DATE, 'YYYYMM');
  SELECT COUNT(*) + 1 INTO seq FROM bills
  WHERE company_id = p_company_id
    AND to_char(bill_date, 'YYYYMM') = ym
    AND deleted_at IS NULL;
  RETURN 'BIL-' || ym || '-' || lpad(seq::text, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Create or refresh bill from trip (freight → base_amount)
CREATE OR REPLACE FUNCTION upsert_bill_for_trip(p_trip_id UUID)
RETURNS UUID AS $$
DECLARE
  t RECORD;
  bid UUID;
  amt NUMERIC;
BEGIN
  SELECT * INTO t FROM trips WHERE id = p_trip_id AND deleted_at IS NULL;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Trip not found';
  END IF;

  amt := COALESCE(t.freight_amount, t.bill_amount, 0);

  SELECT id INTO bid FROM bills WHERE trip_id = p_trip_id AND deleted_at IS NULL;

  IF bid IS NULL THEN
    INSERT INTO bills (
      company_id, trip_id, customer_id, created_by, bill_no,
      base_amount, total_amount, due_date
    ) VALUES (
      t.company_id, t.id, t.customer_id, t.created_by,
      generate_bill_number(t.company_id),
      amt, amt,
      (CURRENT_DATE + COALESCE(
        (SELECT payment_terms_days FROM customers_parties WHERE id = t.customer_id),
        30
      ) * INTERVAL '1 day')::DATE
    )
    RETURNING id INTO bid;
  ELSE
    UPDATE bills SET
      base_amount = amt,
      total_amount = amt + tax_amount,
      updated_at = now()
    WHERE id = bid;
  END IF;

  RETURN bid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Refresh bill paid_amount and status from payments
CREATE OR REPLACE FUNCTION refresh_bill_payment_status()
RETURNS TRIGGER AS $$
DECLARE
  bid UUID;
  total_paid NUMERIC;
  bill_total NUMERIC;
BEGIN
  bid := COALESCE(NEW.bill_id, OLD.bill_id);
  IF bid IS NULL AND COALESCE(NEW.trip_id, OLD.trip_id) IS NOT NULL THEN
    SELECT id INTO bid FROM bills
    WHERE trip_id = COALESCE(NEW.trip_id, OLD.trip_id) AND deleted_at IS NULL
    LIMIT 1;
  END IF;
  IF bid IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  SELECT total_amount INTO bill_total FROM bills WHERE id = bid;
  SELECT COALESCE(SUM(amount), 0) INTO total_paid FROM payments
  WHERE (bill_id = bid OR trip_id = (SELECT trip_id FROM bills WHERE id = bid))
    AND deleted_at IS NULL;

  UPDATE bills SET
    paid_amount = total_paid,
    status = CASE
      WHEN total_paid <= 0 THEN 'unpaid'::bill_status
      WHEN total_paid >= bill_total THEN 'paid'::bill_status
      ELSE 'partial'::bill_status
    END,
    updated_at = now()
  WHERE id = bid;

  -- Keep trips.payment_status in sync for existing UI
  UPDATE trips t SET payment_status = CASE
    WHEN total_paid <= 0 THEN 'unpaid'::payment_status
    WHEN total_paid >= COALESCE(t.bill_amount, 0) THEN 'paid'::payment_status
    ELSE 'partially_paid'::payment_status
  END
  FROM bills b
  WHERE b.id = bid AND t.id = b.trip_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Replace legacy trip-only payment trigger with bill-aware version
DROP TRIGGER IF EXISTS trg_refresh_payment_status ON payments;
DROP TRIGGER IF EXISTS trg_refresh_bill_payment_status ON payments;
CREATE TRIGGER trg_refresh_bill_payment_status
  AFTER INSERT OR UPDATE OR DELETE ON payments
  FOR EACH ROW EXECUTE FUNCTION refresh_bill_payment_status();

-- Auto-create bill when trip is completed
CREATE OR REPLACE FUNCTION trips_create_bill_on_complete()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'completed') THEN
    PERFORM upsert_bill_for_trip(NEW.id);
    NEW.completed_at := COALESCE(NEW.completed_at, now());
  END IF;
  IF NEW.status = 'in_transit' AND NEW.started_at IS NULL THEN
    NEW.started_at := now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_trips_create_bill_on_complete ON trips;
CREATE TRIGGER trg_trips_create_bill_on_complete
  BEFORE INSERT OR UPDATE ON trips
  FOR EACH ROW EXECUTE FUNCTION trips_create_bill_on_complete();

-- updated_at triggers
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_companies_updated_at ON companies;
CREATE TRIGGER trg_companies_updated_at
  BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_branches_updated_at ON branches;
CREATE TRIGGER trg_branches_updated_at
  BEFORE UPDATE ON branches FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_customers_updated_at ON customers_parties;
CREATE TRIGGER trg_customers_updated_at
  BEFORE UPDATE ON customers_parties FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_drivers_updated_at ON drivers;
CREATE TRIGGER trg_drivers_updated_at
  BEFORE UPDATE ON drivers FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_vehicles_updated_at ON vehicles;
CREATE TRIGGER trg_vehicles_updated_at
  BEFORE UPDATE ON vehicles FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_bills_updated_at ON bills;
CREATE TRIGGER trg_bills_updated_at
  BEFORE UPDATE ON bills FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS for bills
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS bills_all ON bills;
CREATE POLICY bills_all ON bills FOR ALL
  USING (is_super_admin() OR company_id = current_company_id())
  WITH CHECK (is_super_admin() OR company_id = current_company_id());

-- Backfill bills for completed trips that have bill_amount
INSERT INTO bills (
  company_id, trip_id, customer_id, created_by, bill_no,
  base_amount, total_amount, bill_date, due_date, status, paid_amount
)
SELECT
  t.company_id,
  t.id,
  t.customer_id,
  t.created_by,
  generate_bill_number(t.company_id),
  COALESCE(t.freight_amount, t.bill_amount, 0),
  COALESCE(t.freight_amount, t.bill_amount, 0),
  COALESCE(t.trip_date, CURRENT_DATE),
  (COALESCE(t.trip_date, CURRENT_DATE) + (COALESCE(cp.payment_terms_days, 30) || ' days')::INTERVAL)::DATE,
  CASE t.payment_status
    WHEN 'paid' THEN 'paid'::bill_status
    WHEN 'partially_paid' THEN 'partial'::bill_status
    ELSE 'unpaid'::bill_status
  END,
  COALESCE((
    SELECT SUM(p.amount) FROM payments p
    WHERE p.trip_id = t.id AND p.deleted_at IS NULL
  ), 0)
FROM trips t
JOIN customers_parties cp ON cp.id = t.customer_id
WHERE t.status = 'completed'
  AND t.deleted_at IS NULL
  AND NOT EXISTS (SELECT 1 FROM bills b WHERE b.trip_id = t.id AND b.deleted_at IS NULL);

-- Link existing payments to bills
UPDATE payments p SET bill_id = b.id
FROM bills b
WHERE p.trip_id = b.trip_id
  AND p.bill_id IS NULL
  AND p.deleted_at IS NULL
  AND b.deleted_at IS NULL;
