-- Super admin platform: company CRUD for platform operators
-- Tenant scoping in fleet dashboard is app-layer via fleet_tenant_id cookie.

DROP POLICY IF EXISTS companies_admin_insert ON companies;
CREATE POLICY companies_admin_insert ON companies FOR INSERT
  WITH CHECK (is_super_admin());

DROP POLICY IF EXISTS companies_admin_update ON companies;
CREATE POLICY companies_admin_update ON companies FOR UPDATE
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

DROP POLICY IF EXISTS companies_admin_delete ON companies;
CREATE POLICY companies_admin_delete ON companies FOR DELETE
  USING (is_super_admin());
