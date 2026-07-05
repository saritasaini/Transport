---
name: transport-demo
description: >-
  Guides development of the Transportdemo1 logistics demo: shipments, fleet,
  routes, tracking, and dispatch workflows. Use when the user invokes this skill,
  or asks about transport, logistics, deliveries, fleet, routing, dispatch,
  shipments, carriers, or this demo project.
disable-model-invocation: true
---

# Transport Demo

Skill for building and extending **Transportdemo1** — a logistics / transport operations demo (not production TMS).

## Before coding

1. **Scan the repo** for stack, folder layout, and existing types/APIs. Match them; do not introduce a second pattern.
2. **Clarify scope** if unclear: dashboard only, tracking, dispatch, or full mini-TMS. Default to the smallest slice that satisfies the request.
3. **UI work**: invoke `@impeccable` for visual design, polish, and UX. This skill covers domain logic and product shape.

## Domain model

Use these terms consistently:

| Term | Meaning |
|------|---------|
| **Shipment** | Unit of work moved from origin to destination (order, consignment, load). |
| **Leg** | One segment of a shipment (hub → hub, hub → customer). |
| **Route** | Planned path across legs; may aggregate multiple shipments. |
| **Vehicle** | Truck, van, trailer, or other asset. |
| **Driver** | Person assigned to a vehicle or leg. |
| **Hub / depot** | Warehouse or cross-dock where goods are staged. |
| **Carrier** | External party executing transport (optional in demo). |

### Shipment lifecycle

Prefer a single status enum shared by API and UI:

```
draft → scheduled → picked_up → in_transit → out_for_delivery → delivered
                                                      ↘ exception → resolved
```

- **draft**: created, not assigned.
- **scheduled**: vehicle/driver/time window assigned.
- **picked_up**: cargo collected at origin.
- **in_transit**: moving between hubs or toward destination.
- **out_for_delivery**: last mile.
- **delivered**: closed successfully.
- **exception**: delay, damage, failed attempt; requires reason code + optional note.
- **resolved**: exception handled; may return to in_transit or delivered.

Always store `statusUpdatedAt` (and `exceptionReason` when applicable).

### Demo identifiers

- Human-readable IDs: `SHP-2026-0042`, `VEH-12`, `DRV-08`.
- Use **UTC** for stored timestamps; format in local time only in the UI.
- Seed **5–15** realistic rows per entity type — enough to filter/sort/paginate, not thousands.

## Typical demo surfaces

Implement only what the user asked for. Common slices:

| Surface | Purpose |
|---------|---------|
| **Dashboard** | Active shipments, exceptions, on-time %, fleet utilization. |
| **Shipments list** | Filter by status, date, hub; search by ID or customer. |
| **Shipment detail** | Timeline of status changes, legs, assigned vehicle/driver, ETA. |
| **Dispatch board** | Unassigned shipments; drag or assign to vehicle/driver. |
| **Fleet** | Vehicles, capacity, current assignment, maintenance flag (optional). |
| **Tracking (public-style)** | Lookup by tracking number; show map or step timeline. |

## Business rules (demo level)

Keep rules explicit and testable:

- **ETA**: `scheduledPickup + plannedDuration` per leg; recalculate on exception or delay.
- **Capacity**: vehicle `maxWeightKg` / `maxVolumeM3` — warn on assign, block only if user requests strict validation.
- **Assignment**: one active leg per vehicle at a time unless the codebase already supports multi-stop routes.
- **Audit**: append-only status history entries `{ at, from, to, by, note? }` — do not overwrite past states.

## API and data

- Prefer **REST** or **server actions** already used in the project; one resource per entity (`/shipments`, `/vehicles`).
- List endpoints: support `status`, `hubId`, `from`, `to`, `q`, `page`, `pageSize`.
- Return stable JSON field names: `camelCase` in TS/JS stacks, `snake_case` only if the project already uses it.
- Mock layer: centralize in `fixtures/` or `mocks/` so UI and tests share the same seed data.

## Implementation checklist

Copy and track when building a feature:

```
- [ ] Types/interfaces for entities + status enum
- [ ] Seed or mock data (realistic cities, windows, weights)
- [ ] API or data layer wired to UI
- [ ] List + detail (or board) with loading and empty states
- [ ] Status transition actions update history + timestamp
- [ ] Errors surfaced in UI (validation, not found, conflict)
```

## Quality bar for this repo

- **Minimal diff** — demo scope; no auth, billing, or multi-tenant unless requested.
- **Accessible UI** — labels on filters, table headers, status badges (not color-only).
- **No secrets** in repo; use `.env.example` for optional map/API keys.
- **Tests** only when requested or when adding non-trivial status/assignment logic.

## Out of scope (unless user asks)

- Real GPS/telematics integrations
- Rate shopping, invoicing, customs
- Multi-tenant RBAC and audit compliance
- Production-grade optimization (VRP, MILP)

## Example user requests → approach

**“Add shipment tracking page”**  
Types + mock shipment with `trackingNumber` → lookup route → timeline component from `statusHistory` → empty/error for unknown ID.

**“Dispatch board”**  
List `scheduled`/`draft` shipments + available vehicles → assign action writes leg + updates status to `scheduled` → refresh board.

**“Dashboard KPIs”**  
Derive from seed data: count by status, % delivered on time (compare `deliveredAt` vs `promisedAt`), open exceptions.
