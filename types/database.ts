export type UserRole =
  | "super_admin"
  | "transporter_admin"
  | "sub_admin"
  | "dispatcher"
  | "accountant"
  | "fleet_manager"
  | "driver";

export type PartyType = "customer" | "vendor" | "transporter";
export type DriverAvailability = "available" | "assigned" | "off_duty";
export type VehicleCategory = "owned" | "rented" | "leased";
export type VehicleStatus = "available" | "on_trip" | "maintenance" | "rented_out";
export type TripStatus =
  | "pending"
  | "assigned"
  | "in_transit"
  | "hold"
  | "cancelled"
  | "completed";
export type PaymentStatus = "unpaid" | "partially_paid" | "paid";
export type ExpenseCategory =
  | "fuel"
  | "driver_allowance"
  | "toll"
  | "food"
  | "parking"
  | "maintenance"
  | "miscellaneous";
export type PaymentMode =
  | "cash"
  | "bank_transfer"
  | "cheque"
  | "upi"
  | "neft"
  | "rtgs";

export type BillStatus = "unpaid" | "partial" | "paid" | "overdue" | "disputed";
export type RentalType = "rent_in" | "rent_out";

export type AppModule =
  | "dashboard"
  | "trips"
  | "drivers"
  | "vehicles"
  | "challans"
  | "parties"
  | "expenses"
  | "payments"
  | "rentals"
  | "reports"
  | "notifications"
  | "branches"
  | "users"
  | "tally"
  | "job_sheet"
  | "recovery";

export interface Company {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  retention_days: number;
  plan: string;
  gstin: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  company_id: string | null;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  branch_id: string | null;
  last_login_at: string | null;
  created_at: string;
}

export interface Branch {
  id: string;
  company_id: string;
  name: string;
  location: string | null;
  city?: string | null;
  state?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface CustomerParty {
  id: string;
  company_id: string;
  type: PartyType;
  name: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  gst_number: string | null;
  credit_limit?: number;
  outstanding_balance?: number;
  payment_terms_days?: number;
  is_active: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at?: string;
}

export interface Driver {
  id: string;
  company_id: string;
  full_name: string;
  phone: string | null;
  license_number: string | null;
  license_expiry_date: string | null;
  availability_status: DriverAvailability;
  address: string | null;
  joined_date: string | null;
  is_active: boolean;
  deleted_at: string | null;
  created_at: string;
}

export interface Vehicle {
  id: string;
  company_id: string;
  registration_number: string;
  category: VehicleCategory;
  vehicle_type: string | null;
  model: string | null;
  base_branch_id: string | null;
  current_status: VehicleStatus;
  insurance_expiry: string | null;
  fitness_expiry: string | null;
  permit_expiry: string | null;
  last_odometer_reading: number;
  is_active: boolean;
  deleted_at: string | null;
  created_at: string;
}

export interface Trip {
  id: string;
  company_id: string;
  trip_number: string;
  customer_id: string;
  driver_id: string | null;
  vehicle_id: string | null;
  branch_id: string | null;
  origin: string;
  destination: string;
  start_location: string;
  fleet_origin: string;
  status: TripStatus;
  trip_date: string;
  odometer_start: number | null;
  odometer_end: number | null;
  distance_covered: number | null;
  bill_amount: number;
  freight_amount?: number | null;
  advance_paid?: number;
  goods_type?: string | null;
  weight_tons?: number | null;
  eway_bill_no?: string | null;
  lr_number?: string | null;
  pod_received?: boolean;
  pod_image_url?: string | null;
  hold_reason?: string | null;
  cancel_reason?: string | null;
  scheduled_at?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  approved_by?: string | null;
  payment_status: PaymentStatus;
  is_locked: boolean;
  notes: string | null;
  created_by: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  customer?: CustomerParty;
  driver?: Driver;
  vehicle?: Vehicle;
}

export interface TripExpense {
  id: string;
  trip_id: string;
  company_id: string;
  category: ExpenseCategory;
  amount: number;
  description: string | null;
  expense_date: string;
  created_by: string | null;
  deleted_at: string | null;
  created_at: string;
  trip?: Trip;
}

export interface Bill {
  id: string;
  company_id: string;
  trip_id: string;
  customer_id: string;
  created_by: string | null;
  bill_no: string;
  bill_date: string;
  due_date: string;
  base_amount: number;
  tax_percent: number;
  tax_amount: number;
  transporter_gstin?: string | null;
  customer_gstin?: string | null;
  cgst_amount?: number;
  sgst_amount?: number;
  igst_amount?: number;
  is_reverse_charge?: boolean;
  total_amount: number;
  paid_amount: number;
  status: BillStatus;
  notes: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  trip?: Trip;
  customer?: CustomerParty;
}

export interface Payment {
  id: string;
  trip_id: string;
  company_id: string;
  customer_id: string;
  bill_id?: string | null;
  amount: number;
  payment_mode: PaymentMode;
  payment_date: string;
  reference_note: string | null;
  reference_no?: string | null;
  tds_deducted?: number;
  tds_certificate_no?: string | null;
  net_received?: number;
  created_by: string | null;
  deleted_at: string | null;
  created_at: string;
}

export interface Challan {
  id: string;
  company_id: string;
  vehicle_id: string;
  driver_id: string | null;
  trip_id: string | null;
  challan_no: string;
  amount: number;
  issue_date: string;
  status: 'pending' | 'paid' | 'contested';
  deduct_from_driver: boolean;
  notes: string | null;
  created_by: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  vehicle?: Vehicle;
  driver?: Driver;
  trip?: Trip;
}

export interface Notification {
  id: string;
  company_id: string;
  user_id: string | null;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  related_entity_type: string | null;
  related_entity_id: string | null;
  created_at: string;
}

export interface DeletedRecord {
  id: string;
  company_id: string;
  entity_type: string;
  entity_id: string;
  data: Record<string, unknown>;
  deleted_by: string | null;
  deleted_at: string;
  restored_at: string | null;
  retention_until: string;
}
