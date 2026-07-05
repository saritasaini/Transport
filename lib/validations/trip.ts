import { z } from "zod";

export const tripSchema = z.object({
  customer_id: z.string().uuid("Customer is required"),
  vehicle_id: z.string().uuid().optional().nullable(),
  driver_id: z.string().uuid().optional().nullable(),
  branch_id: z.string().uuid().optional().nullable(),
  origin: z.string().min(1, "Origin is required"),
  destination: z.string().min(1, "Destination is required"),
  start_location: z.string().min(1, "Start location is required"),
  fleet_origin: z.string().min(1, "Fleet origin is required"),
  trip_date: z.string().min(1),
  odometer_start: z.coerce.number().optional().nullable(),
  bill_amount: z.coerce.number().min(0).default(0),
  notes: z.string().optional().nullable(),
});

export const tripStatusSchema = z.object({
  status: z.enum([
    "pending",
    "assigned",
    "in_transit",
    "hold",
    "cancelled",
    "completed",
  ]),
  odometer_end: z.coerce.number().optional().nullable(),
  note: z.string().optional(),
});

export type TripFormValues = z.infer<typeof tripSchema>;
