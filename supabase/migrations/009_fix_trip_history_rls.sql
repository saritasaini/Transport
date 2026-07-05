-- Add missing INSERT policy for trip_status_history
CREATE POLICY trip_history_insert ON trip_status_history FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM trips t 
      WHERE t.id = trip_id 
      AND (is_super_admin() OR t.company_id = current_company_id())
    )
  );

-- Also ensure we have UPDATE and DELETE if needed (though history shouldn't be edited)
-- But just in case, we can add them or leave them restricted.

-- Let's make the sync_trip_resources function SECURITY DEFINER just to be absolutely safe 
-- against any RLS recursion or visibility issues during the AFTER INSERT trigger.
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
