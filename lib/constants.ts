import type { AppModule, TripStatus, UserRole } from "@/types/database";

export const TRIP_STATUS_LABELS: Record<TripStatus, string> = {
  pending: "Pending",
  assigned: "Assigned",
  in_transit: "In Transit",
  hold: "Hold",
  cancelled: "Cancelled",
  completed: "Completed",
};

export const TRIP_STATUS_COLORS: Record<TripStatus, string> = {
  pending: "bg-[var(--status-pending)] text-[var(--status-pending-fg)]",
  assigned: "bg-[var(--status-assigned)] text-[var(--status-assigned-fg)]",
  in_transit: "bg-[var(--status-in-transit)] text-[var(--status-in-transit-fg)]",
  hold: "bg-[var(--status-hold)] text-[var(--status-hold-fg)]",
  cancelled: "bg-[var(--status-cancelled)] text-[var(--status-cancelled-fg)]",
  completed: "bg-[var(--status-completed)] text-[var(--status-completed-fg)]",
};

export const NAV_GROUPS: { label: string; modules: AppModule[] }[] = [
  { label: "Overview", modules: ["dashboard"] },
  {
    label: "Operations",
    modules: ["trips", "drivers", "vehicles", "challans", "parties"],
  },
  {
    label: "Finance",
    modules: ["payments", "job_sheet", "rentals", "reports", "tally"],
  },
  {
    label: "Admin",
    modules: ["notifications", "branches", "users", "recovery"],
  },
];

export const ROLE_DEFAULT_MODULES: Record<UserRole, AppModule[]> = {
  super_admin: [
    "dashboard", "trips", "drivers", "vehicles", "challans", "parties", "expenses",
    "payments", "job_sheet", "rentals", "reports", "notifications", "branches", "users",
    "tally", "recovery",
  ],
  transporter_admin: [
    "dashboard", "trips", "drivers", "vehicles", "challans", "parties", "expenses",
    "payments", "job_sheet", "rentals", "reports", "notifications", "branches", "users",
    "tally", "recovery",
  ],
  sub_admin: ["dashboard"],
  dispatcher: ["dashboard", "trips", "drivers", "vehicles", "expenses", "notifications"],
  accountant: ["dashboard", "payments", "expenses", "reports", "tally", "parties", "notifications"],
  fleet_manager: ["dashboard", "vehicles", "drivers", "reports", "notifications"],
  driver: ["dashboard", "trips", "expenses"],
};

export const MODULE_ROUTES: Record<AppModule, string> = {
  dashboard: "/dashboard",
  trips: "/dashboard/trips",
  drivers: "/dashboard/drivers",
  vehicles: "/dashboard/vehicles",
  challans: "/dashboard/challans",
  parties: "/dashboard/parties",
  expenses: "/dashboard/expenses",
  payments: "/dashboard/payments",
  job_sheet: "/dashboard/job-sheet",
  rentals: "/dashboard/rentals",
  reports: "/dashboard/reports",
  notifications: "/dashboard/notifications",
  branches: "/dashboard/settings/branches",
  users: "/dashboard/settings/users",
  tally: "/dashboard/tally",
  recovery: "/dashboard/settings/recovery",
};

export const MODULE_LABELS: Record<AppModule, string> = {
  dashboard: "Dashboard",
  trips: "Trips",
  drivers: "Drivers",
  vehicles: "Vehicles",
  challans: "Traffic Challans",
  parties: "Customers & Parties",
  expenses: "Expenses",
  payments: "Payments",
  job_sheet: "Job Sheet & Expenses",
  rentals: "Rent In / Out",
  reports: "Reports",
  notifications: "Notifications",
  branches: "Branches",
  users: "User Management",
  tally: "Tally Integration",
  recovery: "Deleted Records",
};

export const ACTIVE_TRIP_STATUSES: TripStatus[] = [
  "pending",
  "assigned",
  "in_transit",
  "hold",
];
