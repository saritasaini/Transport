# Fleet Control — Visual design

**Register:** Product (operations dashboard)  
**Scene:** Dispatchers and fleet managers at a desk under office lighting; clarity and scan speed matter more than decoration.

## Color

- **Strategy:** Restrained. Warm stone neutrals (hue ~40) + amber primary (~32°) for actions and brand mark.
- **Format:** OKLCH CSS variables in `globals.css`. Tinted neutrals, no pure black or white.
- Trip statuses use semantic `--status-*` tokens.

## Typography

- **IBM Plex Sans** for UI (replaces Inter). Tabular figures on metrics and dates.
- **Page titles:** fluid `clamp(1.25rem, 1.1rem + 0.5vw, 1.75rem)` via `--text-page-title`.
- **UI scale (fixed):** section `text-base font-semibold`, labels `text-2xs uppercase tracking-wide`, body `text-sm`.

## Layout

- Sidebar: secondary surface (`--sidebar`), grouped nav (Overview / Operations / Finance / Admin).
- Mobile: sidebar hidden below `lg`; Sheet drawer from navbar menu trigger.
- Main: `max-w-7xl`, `bg-muted/25`, sections use `SectionPanel`.
- KPIs: dense `KpiStrip` grid with horizontal scroll on mobile.

## Spacing

- 8px base unit (`--space-1` = 0.5rem). Section gaps: `gap-4`, `gap-6`, `gap-8` only.

## Motion

- 200ms, `cubic-bezier(0.25, 1, 0.5, 1)`. No bounce. Respect `prefers-reduced-motion`.

## Components

- **SectionPanel:** single-border section with optional header + action (replaces Card nesting).
- **DataTableShell:** unified table wrapper with compact uppercase headers.
- **EmptyState:** icon in muted circle + title + description + optional CTA.
- **Status:** `TripStatusBadge` from OKLCH tokens.
- **Radius:** `--radius: 0.25rem` (4px). No default card shadows.
