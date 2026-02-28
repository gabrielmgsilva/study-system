# AME ONE — Changelog

## 2026-01-21 — Stage 1: licence-first unlock + build fixes

### Product / UX
- Student Area now manages access by **licence plan** (Basic / Standard / Premium) instead of per-module unlock.
- Added a lightweight “Choose plan” control per licence (dev/MVP) that calls `POST /api/entitlements/set-plan`.

### Entitlements model alignment
- Added licence-first helpers:
  - `hasLicenseFromState(state, licenseId)`
  - `canAccessModuleFromState(state, moduleKey)` (handles logbook requiring `logbook: true`)
- `EntitlementGuard` now accepts licence-first access (keeps legacy per-module entitlements as fallback).
- `GET /api/me/student` no longer forces default Basic for every licence; missing rows now mean “not owned yet”.

### Build stability
- Fixed broken REGS imports (`src/app/app/regs/page.tsx`) by correcting path depth.
- Fixed M → Standard Practices imports to match the new data layout (`data/m/standard_practices/*`).
- Added missing placeholder JSON files required by static imports:
  - `data/regs/regs.json`
  - `data/m/standard_practices/01_*.json` … `10_*.json`

### Notes / next steps
- Hub + licence pages still contain some “legacy unlock” visuals; stage 2 will normalize all screens to the plan model.

## 2026-01-20 — Visual Rebuild + Entitlements (Patch)

### UI / UX
- Added reusable **GlassPanel** and **GlassCard** components for consistent, readable “premium glass” UI (`src/components/ui/glass.tsx`).
- Rebuilt **Landing** (`src/app/page.tsx`) with:
  - Blueprint background kept, but all text now sits inside panels/cards with guaranteed contrast.
  - Real logo path expected at `/public/home/logo.svg` (placeholder provided in this patch).
  - Clear hierarchy, CTAs, and licence-first positioning.
- Rebuilt **Pricing** (`src/app/pricing/page.tsx`) with licence-first copy and plan framing.
- Added `favicon.ico` and `favicon.png` placeholders.

### Product Model
- Formalized “Licences = products”, no “premium geral”.
- **REGS** treated as global product concept (tile already present in Hub; pricing/landing copy reinforced).

### Backend / Entitlements
- Introduced `LicenseEntitlement` model to capture per-licence plan experience (basic/standard/premium) with the simplified access types:
  - flashcards: daily_limit | unlimited
  - practice: cooldown | unlimited
  - test: weekly_limit | unlimited
  - logbook: boolean
- Updated registration to create default licence entitlements (basic) for m/e/s/balloons/regs.
- `GET /api/me/student` now returns `licenseEntitlements` map alongside `credits` and module entitlements.
- Added a minimal **dev-only** endpoint `POST /api/entitlements/set-plan` to change a user plan by licence (to test UX). Billing integration remains future work.

### Study Engine (Perceived Limits)
- `AdvancedEngine` now supports plan-based perceived gating (MVP) using the licence plan from `api/me/student`:
  - Basic: ~20 flashcards/day, 2 practices/day, 1 test/week
  - Standard: unlimited flashcards/practice, 3 tests/week
  - Premium: unlimited everything
- Usage tracking is stored locally (localStorage) for now; entitlements remain server-side source of truth.

### Routes / Consistency
- Landing/pricing now use centralized `ROUTES`.

### Added placeholders
- `public/home/logo.svg`
- `public/home/bg.png`
- `public/favicon.ico`, `public/favicon.png`

## Pendências (próximo sprint)
- Replace placeholder assets with final `public.zip` assets (logo + blueprint bg).
- Run full `next build` + TS check in the real repo root (patch environment lacked package.json).
- Finish route audit automatically (generate a ROUTES ↔ file existence report) and add redirect stubs for any legacy paths that still get external traffic.
- Student Area: expose plan status + upgrade flows (UI) and lock Logbook based on plan.
- Migrate local usage tracking to backend (Prisma) when billing/analytics enters.
