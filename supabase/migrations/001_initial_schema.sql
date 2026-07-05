-- Transport Fleet & Driver Management System
-- Run in Supabase SQL Editor or via supabase db push

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enums
CREATE TYPE user_role AS ENUM (
  'super_admin', 'transporter_admin', 'sub_admin',
  'dispatcher', 'accountant', 'fleet_manager'
);

CREATE TYPE party_type AS ENUM ('customer', 'vendor');
CREATE TYPE driver_availability AS ENUM ('available', 'assigned', 'off_duty');
CREATE TYPE vehicle_category AS ENUM ('owned', 'rented', 'leased');
CREATE TYPE vehicle_status AS ENUM ('available', 'on_trip', 'maintenance', 'rented_out');
CREATE TYPE trip_status AS ENUM ('pending', 'assigned', 'in_transit', 'hold', 'cancelled', 'completed');
CREATE TYPE payment_status AS ENUM ('unpaid', 'partially_paid', 'paid');
CREATE TYPE expense_category AS ENUM (
  'fuel', 'driver_allowance', 'toll', 'food', 'parking', 'maintenance', 'miscellaneous'
);
CREATE TYPE payment_mode AS ENUM ('cash', 'bank_transfer', 'cheque');
CREATE TYPE rental_type AS ENUM ('rent_in', 'rent_out');
CREATE TYPE audit_action AS ENUM ('create', 'edit', 'delete', 'restore');

CREATE TYPE app_module AS ENUM (
  'dashboard', 'trips', 'drivers', 'vehicles', 'parties', 'expenses',
  'payments', 'rentals', 'reports', 'notifications', 'branches', 'users',
  'tally', 'recovery'
);

-- Companies
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  retention_days INT NOT NULL DEFAULT 90,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Branches
CREATE TABLE branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  location TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Users (profile linked to auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'dispatcher',
  is_active BOOLEAN NOT NULL DEFAULT true,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  last_login_at TIMESTAMPTZ,
  last_login_user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE user_module_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  module app_module NOT NULL,
  can_read BOOLEAN NOT NULL DEFAULT true,
  can_write BOOLEAN NOT NULL DEFAULT false,
  UNIQUE (user_id, module)
);

-- Customers & parties
CREATE TABLE customers_parties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  type party_type NOT NULL,
  name TEXT NOT NULL,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  gst_number TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Drivers
CREATE TABLE drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  license_number TEXT,
  license_expiry_date DATE,
  availability_status driver_availability NOT NULL DEFAULT 'available',
  address TEXT,
  joined_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  deleted_at TIMESTAMPTZ,
  license_expiry_notified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Vehicles
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  registration_number TEXT NOT NULL,
  category vehicle_category NOT NULL DEFAULT 'owned',
  vehicle_type TEXT,
  model TEXT,
  base_branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  current_status vehicle_status NOT NULL DEFAULT 'available',
  insurance_expiry DATE,
  fitness_expiry DATE,
  permit_expiry DATE,
  last_odometer_reading NUMERIC(12, 2) DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  deleted_at TIMESTAMPTZ,
  insurance_notified_at TIMESTAMPTZ,
  fitness_notified_at TIMESTAMPTZ,
  permit_notified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, registration_number)
);

-- Trips
CREATE TABLE trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  trip_number TEXT NOT NULL,
  customer_id UUID NOT NULL REFERENCES customers_parties(id),
  driver_id UUID REFERENCES drivers(id),
  vehicle_id UUID REFERENCES vehicles(id),
  branch_id UUID REFERENCES branches(id),
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  start_location TEXT NOT NULL,
  fleet_origin TEXT NOT NULL,
  status trip_status NOT NULL DEFAULT 'pending',
  trip_date DATE NOT NULL DEFAULT CURRENT_DATE,
  odometer_start NUMERIC(12, 2),
  odometer_end NUMERIC(12, 2),
  distance_covered NUMERIC(12, 2) GENERATED ALWAYS AS (
    CASE WHEN odometer_end IS NOT NULL AND odometer_start IS NOT NULL
      THEN GREATEST(odometer_end - odometer_start, 0) ELSE NULL END
  ) STORED,
  bill_amount NUMERIC(14, 2) DEFAULT 0,
  payment_status payment_status NOT NULL DEFAULT 'unpaid',
  is_locked BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_by UUID REFERENCES users(id),
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, trip_number)
);

CREATE TABLE trip_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  from_status trip_status,
  to_status trip_status NOT NULL,
  changed_by UUID REFERENCES users(id),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trip expenses
CREATE TABLE trip_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  category expense_category NOT NULL,
  amount NUMERIC(14, 2) NOT NULL CHECK (amount >= 0),
  description TEXT,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by UUID REFERENCES users(id),
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Payments
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers_parties(id),
  amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
  payment_mode payment_mode NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  reference_note TEXT,
  created_by UUID REFERENCES users(id),
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Rent in / rent out
CREATE TABLE rent_in_rent_out (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  type rental_type NOT NULL,
  vendor_id UUID NOT NULL REFERENCES customers_parties(id),
  vehicle_description TEXT,
  vehicle_number TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  agreed_rate NUMERIC(14, 2),
  total_amount NUMERIC(14, 2),
  status TEXT NOT NULL DEFAULT 'active',
  return_confirmed_at TIMESTAMPTZ,
  notes TEXT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  related_entity_type TEXT,
  related_entity_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Audit logs
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id),
  action audit_action NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Soft-deleted records
CREATE TABLE deleted_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  data JSONB NOT NULL,
  deleted_by UUID REFERENCES users(id),
  deleted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  restored_at TIMESTAMPTZ,
  retention_until TIMESTAMPTZ NOT NULL
);

-- Indexes
CREATE INDEX idx_trips_company_status_date ON trips(company_id, status, trip_date);
CREATE INDEX idx_trips_vehicle ON trips(vehicle_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_trips_driver ON trips(driver_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_trips_customer ON trips(customer_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_vehicles_company ON vehicles(company_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_drivers_company ON drivers(company_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX idx_expenses_trip ON trip_expenses(trip_id);

-- Helper: current user's profile
CREATE OR REPLACE FUNCTION public.current_user_profile()
RETURNS users AS $$
  SELECT * FROM users WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.current_company_id()
RETURNS UUID AS $$
  SELECT company_id FROM users WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS user_role AS $$
  SELECT role FROM users WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin');
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.has_module_access(m app_module, need_write BOOLEAN DEFAULT false)
RETURNS BOOLEAN AS $$
DECLARE
  r user_role;
BEGIN
  SELECT role INTO r FROM users WHERE id = auth.uid();
  IF r = 'super_admin' THEN RETURN true; END IF;
  IF r = 'transporter_admin' THEN RETURN true; END IF;
  IF r = 'sub_admin' THEN
    IF need_write THEN
      RETURN EXISTS (
        SELECT 1 FROM user_module_permissions
        WHERE user_id = auth.uid() AND module = m AND can_write = true
      );
    END IF;
    RETURN EXISTS (
      SELECT 1 FROM user_module_permissions
      WHERE user_id = auth.uid() AND module = m AND can_read = true
    );
  END IF;
  IF r = 'dispatcher' AND m IN ('dashboard','trips','drivers','vehicles','expenses','notifications') THEN RETURN true; END IF;
  IF r = 'accountant' AND m IN ('dashboard','payments','expenses','reports','tally','parties','notifications') THEN RETURN true; END IF;
  IF r = 'fleet_manager' AND m IN ('dashboard','vehicles','drivers','reports','notifications') THEN RETURN true; END IF;
  RETURN false;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- Trip number generation
CREATE OR REPLACE FUNCTION generate_trip_number(p_company_id UUID)
RETURNS TEXT AS $$
DECLARE
  seq INT;
  d TEXT;
BEGIN
  d := to_char(CURRENT_DATE, 'YYYYMMDD');
  SELECT COUNT(*) + 1 INTO seq FROM trips
  WHERE company_id = p_company_id AND trip_date = CURRENT_DATE;
  RETURN 'TRP-' || d || '-' || lpad(seq::text, 4, '0');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION trips_set_trip_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.trip_number IS NULL OR NEW.trip_number = '' THEN
    NEW.trip_number := generate_trip_number(NEW.company_id);
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_trips_trip_number
  BEFORE INSERT OR UPDATE ON trips
  FOR EACH ROW EXECUTE FUNCTION trips_set_trip_number();

-- Active trip check for driver/vehicle (BR-01, BR-02, BR-07)
CREATE OR REPLACE FUNCTION check_trip_assignment()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.driver_id IS NOT NULL AND NEW.status IN ('pending','assigned','in_transit','hold') THEN
    IF EXISTS (
      SELECT 1 FROM trips t
      WHERE t.id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
        AND t.driver_id = NEW.driver_id
        AND t.deleted_at IS NULL
        AND t.status IN ('pending','assigned','in_transit','hold')
    ) THEN
      RAISE EXCEPTION 'Driver is already on an active trip.';
    END IF;
  END IF;
  IF NEW.vehicle_id IS NOT NULL AND NEW.status IN ('pending','assigned','in_transit','hold') THEN
    IF EXISTS (
      SELECT 1 FROM trips t
      WHERE t.id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
        AND t.vehicle_id = NEW.vehicle_id
        AND t.deleted_at IS NULL
        AND t.status IN ('pending','assigned','in_transit','hold')
    ) THEN
      RAISE EXCEPTION 'Vehicle is already on an active trip.';
    END IF;
  END IF;
  IF TG_OP = 'INSERT' AND NEW.vehicle_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM vehicles v
      WHERE v.id = NEW.vehicle_id AND v.current_status = 'available' AND v.deleted_at IS NULL
    ) THEN
      RAISE EXCEPTION 'Vehicle must be available before trip creation.';
    END IF;
  END IF;
  IF NEW.status = 'completed' THEN
    IF NEW.odometer_end IS NULL OR NEW.odometer_start IS NULL OR NEW.odometer_end <= NEW.odometer_start THEN
      RAISE EXCEPTION 'Odometer end must be greater than odometer start to complete trip.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_trip_assignment
  BEFORE INSERT OR UPDATE ON trips
  FOR EACH ROW EXECUTE FUNCTION check_trip_assignment();

-- Sync driver/vehicle status on trip changes
CREATE OR REPLACE FUNCTION sync_trip_resources()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.driver_id IS NOT NULL THEN
    IF NEW.status IN ('assigned','in_transit') THEN
      UPDATE drivers SET availability_status = 'assigned' WHERE id = NEW.driver_id;
    ELSIF NEW.status IN ('completed','cancelled') THEN
      UPDATE drivers SET availability_status = 'available' WHERE id = NEW.driver_id;
    END IF;
  END IF;
  IF NEW.vehicle_id IS NOT NULL THEN
    IF NEW.status IN ('assigned','in_transit') THEN
      UPDATE vehicles SET current_status = 'on_trip' WHERE id = NEW.vehicle_id;
    ELSIF NEW.status IN ('completed','cancelled') THEN
      UPDATE vehicles SET current_status = 'available' WHERE id = NEW.vehicle_id;
      IF NEW.odometer_end IS NOT NULL THEN
        UPDATE vehicles SET last_odometer_reading = NEW.odometer_end WHERE id = NEW.vehicle_id;
      END IF;
    END IF;
  END IF;
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status) THEN
    INSERT INTO trip_status_history (trip_id, from_status, to_status, changed_by)
    VALUES (NEW.id, CASE WHEN TG_OP = 'UPDATE' THEN OLD.status ELSE NULL END, NEW.status, NEW.created_by);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_trip_resources
  AFTER INSERT OR UPDATE ON trips
  FOR EACH ROW EXECUTE FUNCTION sync_trip_resources();

CREATE OR REPLACE FUNCTION trips_lock_on_complete()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' THEN
    NEW.is_locked := true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_trips_lock_on_complete
  BEFORE UPDATE ON trips
  FOR EACH ROW EXECUTE FUNCTION trips_lock_on_complete();

-- Expense must link to active trip (BR-04)
CREATE OR REPLACE FUNCTION check_expense_trip()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM trips t
    WHERE t.id = NEW.trip_id
      AND t.deleted_at IS NULL
      AND t.status NOT IN ('cancelled','completed')
  ) THEN
    RAISE EXCEPTION 'Expense must be linked to an active (non-cancelled, non-completed) trip.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_expense_trip
  BEFORE INSERT OR UPDATE ON trip_expenses
  FOR EACH ROW EXECUTE FUNCTION check_expense_trip();

-- Payment status auto-update
CREATE OR REPLACE FUNCTION refresh_trip_payment_status()
RETURNS TRIGGER AS $$
DECLARE
  total_paid NUMERIC;
  bill NUMERIC;
  tid UUID;
BEGIN
  tid := COALESCE(NEW.trip_id, OLD.trip_id);
  SELECT bill_amount INTO bill FROM trips WHERE id = tid;
  SELECT COALESCE(SUM(amount), 0) INTO total_paid FROM payments
  WHERE trip_id = tid AND deleted_at IS NULL;
  UPDATE trips SET payment_status = CASE
    WHEN total_paid <= 0 THEN 'unpaid'::payment_status
    WHEN total_paid >= bill THEN 'paid'::payment_status
    ELSE 'partially_paid'::payment_status
  END WHERE id = tid;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_refresh_payment_status
  AFTER INSERT OR UPDATE OR DELETE ON payments
  FOR EACH ROW EXECUTE FUNCTION refresh_trip_payment_status();

-- Enable RLS
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_module_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers_parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE rent_in_rent_out ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE deleted_records ENABLE ROW LEVEL SECURITY;

-- RLS Policies (company scoped)
CREATE POLICY companies_select ON companies FOR SELECT
  USING (is_super_admin() OR id = current_company_id());

CREATE POLICY branches_all ON branches FOR ALL
  USING (is_super_admin() OR company_id = current_company_id())
  WITH CHECK (is_super_admin() OR company_id = current_company_id());

CREATE POLICY users_select ON users FOR SELECT
  USING (is_super_admin() OR company_id = current_company_id() OR id = auth.uid());

CREATE POLICY users_update_self ON users FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY users_admin ON users FOR ALL
  USING (is_super_admin() OR (company_id = current_company_id() AND current_user_role() IN ('transporter_admin','super_admin')))
  WITH CHECK (is_super_admin() OR company_id = current_company_id());

CREATE POLICY parties_all ON customers_parties FOR ALL
  USING (is_super_admin() OR company_id = current_company_id())
  WITH CHECK (is_super_admin() OR company_id = current_company_id());

CREATE POLICY drivers_all ON drivers FOR ALL
  USING (is_super_admin() OR company_id = current_company_id())
  WITH CHECK (is_super_admin() OR company_id = current_company_id());

CREATE POLICY vehicles_all ON vehicles FOR ALL
  USING (is_super_admin() OR company_id = current_company_id())
  WITH CHECK (is_super_admin() OR company_id = current_company_id());

CREATE POLICY trips_all ON trips FOR ALL
  USING (is_super_admin() OR company_id = current_company_id())
  WITH CHECK (is_super_admin() OR company_id = current_company_id());

CREATE POLICY trip_history_select ON trip_status_history FOR SELECT
  USING (EXISTS (SELECT 1 FROM trips t WHERE t.id = trip_id AND (is_super_admin() OR t.company_id = current_company_id())));

CREATE POLICY expenses_all ON trip_expenses FOR ALL
  USING (is_super_admin() OR company_id = current_company_id())
  WITH CHECK (is_super_admin() OR company_id = current_company_id());

CREATE POLICY payments_all ON payments FOR ALL
  USING (is_super_admin() OR company_id = current_company_id())
  WITH CHECK (is_super_admin() OR company_id = current_company_id());

CREATE POLICY rentals_all ON rent_in_rent_out FOR ALL
  USING (is_super_admin() OR company_id = current_company_id())
  WITH CHECK (is_super_admin() OR company_id = current_company_id());

CREATE POLICY notifications_all ON notifications FOR ALL
  USING (is_super_admin() OR company_id = current_company_id() OR user_id = auth.uid())
  WITH CHECK (is_super_admin() OR company_id = current_company_id());

CREATE POLICY audit_select ON audit_logs FOR SELECT
  USING (is_super_admin() OR company_id = current_company_id());

CREATE POLICY deleted_all ON deleted_records FOR ALL
  USING (is_super_admin() OR company_id = current_company_id())
  WITH CHECK (is_super_admin() OR company_id = current_company_id());

CREATE POLICY permissions_all ON user_module_permissions FOR ALL
  USING (EXISTS (SELECT 1 FROM users u WHERE u.id = user_module_permissions.user_id
    AND (is_super_admin() OR u.company_id = current_company_id())))
  WITH CHECK (EXISTS (SELECT 1 FROM users u WHERE u.id = user_module_permissions.user_id
    AND (is_super_admin() OR u.company_id = current_company_id())));

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE trips;

-- Seed helper (run manually after first auth user)
-- INSERT INTO companies (name, email) VALUES ('Demo Transport Co', 'admin@demo.com');
