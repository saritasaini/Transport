# Fleet Control

**Register:** product (fleet workspace) and platform (super admin at `/platform`)

## Multi-tenant architecture

- **Tenant** = one row in `companies` (ERD: `organizations`).
- **Tenant users** have `users.company_id` set; all fleet routes scope data with `effectiveCompanyId`.
- **Super admin** has `role = super_admin`, optional `company_id = NULL`, uses `/platform` to create and manage tenants.
- **Impersonation:** super admin selects a company; `fleet_tenant_id` cookie sets `effectiveCompanyId` for `/dashboard` until cleared.

## Users

Dispatchers, fleet managers, accountants, and transporter admins at Indian logistics companies. They work at desks under office lighting, often switching between phone calls and the screen. They need fast scan speed, dense data, and zero ambiguity on trip and payment status.

## Product Purpose

Fleet Control is a B2B transport operations platform for managing trips, drivers, vehicles, expenses, payments, and compliance documents. The UI must disappear into the task: assign trips, track fleet utilization, chase outstanding bills, and export to Tally.

## Brand Personality

Professional, precise, calm under pressure. Feels like software a company pays ₹50,000+ per month for: authoritative without being cold, efficient without being sterile.

## Anti-references

- Generic purple-gradient AI SaaS dashboards
- Oversized hero-metric stat cards
- Card-inside-card nesting and excessive shadows
- Inter-default startup aesthetic
- Decorative glassmorphism and bounce animations

## Strategic Design Principles

1. **Scan speed over decoration** — hierarchy through type weight and spacing, not color noise.
2. **One surface per section** — borders and tints, not nested cards.
3. **Restrained color** — warm stone neutrals + amber accent for primary actions only.
4. **Density with clarity** — data-dense tables and KPIs with accessible contrast.
5. **Familiar product patterns** — sidebar nav, compact headers, standard table affordances.

## Accessibility

WCAG AA contrast on all text and interactive states. Large touch targets (44px) on mobile. Respect `prefers-reduced-motion`.
