import { z } from "zod";

export const branchSchema = z.object({
  name: z.string().min(1, "Name is required"),
  location: z.string().optional().nullable(),
});

export const partySchema = z.object({
  type: z.enum(["customer", "vendor"]),
  name: z.string().min(1, "Name is required"),
  contact_person: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().or(z.literal("")).nullable(),
  address: z.string().optional().nullable(),
  gst_number: z.string().optional().nullable(),
});

export const driverSchema = z.object({
  full_name: z.string().min(1, "Name is required"),
  phone: z.string().optional().nullable(),
  license_number: z.string().optional().nullable(),
  license_expiry_date: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  joined_date: z.string().optional().nullable(),
});

export const vehicleSchema = z.object({
  registration_number: z.string().min(1, "Registration number is required"),
  category: z.enum(["owned", "rented", "leased"]),
  vehicle_type: z.string().optional().nullable(),
  model: z.string().optional().nullable(),
  base_branch_id: z.string().uuid().optional().nullable(),
  insurance_expiry: z.string().optional().nullable(),
  fitness_expiry: z.string().optional().nullable(),
  permit_expiry: z.string().optional().nullable(),
  last_odometer_reading: z.coerce.number().min(0).default(0),
});

export const expenseSchema = z.object({
  trip_id: z.string().uuid(),
  category: z.enum([
    "fuel",
    "driver_allowance",
    "toll",
    "food",
    "parking",
    "maintenance",
    "miscellaneous",
  ]),
  amount: z.coerce.number().positive("Amount must be positive"),
  description: z.string().optional().nullable(),
  expense_date: z.string().min(1),
});

export const paymentSchema = z.object({
  trip_id: z.string().uuid(),
  customer_id: z.string().uuid(),
  amount: z.coerce.number().positive(),
  tds_deducted: z.coerce.number().min(0).optional().nullable(),
  net_received: z.coerce.number().min(0).optional().nullable(),
  payment_mode: z.enum(["cash", "bank_transfer", "cheque", "upi", "neft", "rtgs"]),
  payment_date: z.string().min(1),
  reference_note: z.string().optional().nullable(),
});

export const challanSchema = z.object({
  vehicle_id: z.string().uuid(),
  driver_id: z.string().uuid().optional().nullable(),
  trip_id: z.string().uuid().optional().nullable(),
  challan_no: z.string().min(1, "Challan number is required"),
  amount: z.coerce.number().min(0),
  issue_date: z.string().min(1),
  status: z.enum(["pending", "paid", "contested"]),
  deduct_from_driver: z.boolean().default(false),
  notes: z.string().optional().nullable(),
});
