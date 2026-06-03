# andremauricedavis.com — Live Handoff Document

> **Purpose:** This document is the authoritative session-by-session record of all work completed, decisions made, open tasks, and relevant links for the andremauricedavis.com platform project. Every agent beginning a session must read this document first. Every agent ending a session (triggered by "Close this session") must update this document before concluding.

---

## Project Overview

A consolidated personal platform that aggregates content from Facebook, Reddit, LinkedIn, and YouTube into a single community-facing experience. Features include:

- **Content feed** — curated posts imported from social platforms via API/RSS (admin-managed)
- **Discussion board** — threaded discussion tied to each piece of content
- **Community analytics** — cohort analysis on post + user attributes, admin-publishable visualizations
- **Admin panel** — import controls, data stewardship, content moderation, analysis scope tools
- **User auth** — Google OAuth login; UUID-based user tracking (no email stored); duplicate UUID awareness for admins

**Hosting:** GitHub Pages (development/review) → `andremauricedavis.com` via Hostinger (production)
**Repo:** https://github.com/andredavisme/andremauricedavis.com
**Database:** Supabase — `andredavisme's Project` (`hhyhulqngdkwsxhymmcd`, `us-west-2`)
**Database convention:** All tables for this project use the `amd_` prefix (e.g., `amd_posts`, `amd_users`) to avoid collisions with ~100+ existing tables in the shared public schema. No separate schemas — public only.

---

## Infrastructure Catalog

| Resource | Value |
|---|---|
| GitHub Repo | https://github.com/andredavisme/andremauricedavis.com |
| GitHub Pages URL | https://andredavisme.github.io/andremauricedavis.com |
| Production Domain | https://andremauricedavis.com (Hostinger — CNAME to GitHub Pages) |
| Supabase Project Name | andredavisme's Project |
| Supabase Project ID | `hhyhulqngdkwsxhymmcd` |
| Supabase Region | us-west-2 |
| Supabase API URL | https://hhyhulqngdkwsxhymmcd.supabase.co |
| Supabase Anon Key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (legacy JWT — see project settings for full key) |
| Supabase Publishable Key | `sb_publishable_haKvwV0M7KMj4Qz69M6WGg_KmIfU-aI` |
| Table Prefix | `amd_` |
| Catalog Doc | `CATALOG.md` in repo root |
| Tutorial Doc | `TUTORIAL.md` in repo root |
| Design Proof | `design-test.html` in repo root |

---

## Agent Protocol

Rules every agent must follow throughout a session, in addition to reading this document at session start and updating it at session close.

### File Push Verification

**After any file is pushed — whether by agent API call or manual upload — always verify via the commit log, not by re-reading file content.**

- ✅ Use `list_commits` to confirm the most recent commit message and timestamp match the expected push
- ✅ If re-reading a file is necessary, check the `size` field: a suspiciously small file (e.g., <100 bytes) after a known large push indicates a stale cache or failed upload
- ✅ If file content appears stale after a confirmed commit exists, trust the commit — the API blob cache lags behind the web UI by up to ~60 seconds
- ❌ Do not re-read file content as the sole confirmation of a successful push
- ❌ Do not trigger user troubleshooting based on stale file content alone — check the commit log first

> **Why this exists:** On 2026-06-02 (Session 004), a manual upload of `design-test.html` (534KB) landed successfully but the API returned stale placeholder content for ~2 minutes after the commit was confirmed. The agent incorrectly initiated a troubleshooting sequence that required user involvement to resolve. This rule prevents that pattern.

---

## Session Log

---

### Session 001 — Project Foundation

**Date:** 2026-06-02
**Session opened:** 10:26 AM EDT
**Session closed:** 10:35 AM EDT (estimated)
**Active working time:** ~9 minutes
**Actual elapsed time:** ~9 minutes

#### Decisions Made

- **Supabase project:** Use existing `andredavisme's Project` (`hhyhulqngdkwsxhymmcd`) — shared project with many other app tables
- **Schema strategy:** Stay in `public` schema only; use `amd_` table name prefix to avoid conflicts (separate schema caused auth issues in prior projects)
- **Repo visibility:** Public — required for GitHub Pages free hosting
- **Hosting path:** GitHub Pages for development/review; Hostinger (`andremauricedavis.com`) for production (files will be replaced once ready)
- **Domain:** `andremauricedavis.com` already registered and assigned on Hostinger
- **User auth:** Google OAuth; UUID per user; no email stored in DB; admin visibility into potential duplicate UUIDs via content similarity
- **Time tracking:** Each session section in this document includes session open/close timestamps, active working time, and actual elapsed time

#### Tasks Completed

- [x] Reviewed GitHub account — confirmed username `andredavisme`
- [x] Confirmed Supabase project (`hhyhulqngdkwsxhymmcd`) and retrieved publishable key
- [x] Audited existing public schema tables (~100+ tables across other projects — documented prefix strategy)
- [x] Created GitHub repository: https://github.com/andredavisme/andremauricedavis.com
- [x] Created `HANDOFF.md` (this document)
- [x] Created `TUTORIAL.md`
- [x] Created `CATALOG.md`
- [x] Created initial `index.html` placeholder with GitHub Pages config

#### Tasks Left Open

- [ ] Design system proof (`design-test.html`) — establish visual tokens before building
- [ ] Build full platform frontend (feed, discussion board, admin panel, auth)
- [ ] Configure GitHub Pages custom domain (CNAME file → Hostinger DNS update)
- [ ] Decide on content source priority order (API vs RSS vs programmatic vs manual) per platform

#### Relevant Links

- Repo: https://github.com/andredavisme/andremauricedavis.com
- GitHub Pages: https://andredavisme.github.io/andremauricedavis.com
- Supabase Dashboard: https://supabase.com/dashboard/project/hhyhulqngdkwsxhymmcd
- Catalog: https://github.com/andredavisme/andremauricedavis.com/blob/main/CATALOG.md
- Tutorial: https://github.com/andredavisme/andremauricedavis.com/blob/main/TUTORIAL.md

---

### Session 002 — Initial Database Schema + Admin RLS Policies

**Date:** 2026-06-02
**Session opened:** 11:42 AM EDT
**Session closed:** 12:04 PM EDT
**Active working time:** ~22 minutes
**Actual elapsed time:** ~22 minutes

#### Decisions Made

- **Schema tables:** 6 core tables created under `amd_` prefix: `amd_content_sources`, `amd_posts`, `amd_users`, `amd_discussion_threads`, `amd_discussion_posts`, `amd_import_log`
- **RLS:** Enabled on all 6 tables from the start. Initial policies: authenticated users can read published posts, open threads, approved discussion posts; users can insert pending comments; users can read/update their own record
- **Admin RLS function:** `amd_is_admin()` — STABLE, SECURITY DEFINER function; returns true if `auth.uid()` matches a row in `amd_users` where `role = 'admin'`. Used as the gate for all admin policies.
- **Admin RLS policy pattern:** One PERMISSIVE `FOR ALL` policy per table named `amd_admin_all_<table>`. Admin policies layer on top of existing platform-user policies — both can coexist because they are both PERMISSIVE.
- **Duplicate UUID detection:** `amd_users.suspected_duplicate_of` (self-referencing FK) + `duplicate_confidence` (low/medium/high) — admin-managed, no automatic confirmation
- **updated_at automation:** Shared trigger function `amd_set_updated_at()` applied to all tables with `updated_at` column
- **Post approval flow:** `amd_posts.is_published` (admin toggles) → `amd_discussion_threads` auto-associated → `amd_discussion_posts.status` (pending → approved/rejected by admin)
- **Import audit:** `amd_import_log` tracks every import attempt: source, trigger type, rows fetched/inserted/skipped, errors
- **attributes JSONB:** Both `amd_posts` and `amd_discussion_posts` carry a GIN-indexed `attributes` JSONB column for flexible cohort analysis metadata

#### Tasks Completed

- [x] Audited existing public schema — confirmed no `amd_` table conflicts
- [x] Applied migration `amd_initial_schema` — 6 tables, indexes, triggers, RLS platform-user policies
- [x] Applied migration `amd_admin_rls_policies` — `amd_is_admin()` helper function + 6 admin PERMISSIVE FOR ALL policies (one per table)
- [x] Updated `TUTORIAL.md` — added Chapter 2 (Database Schema) and Chapter 3 (RLS & Admin Policies)
- [x] Updated `HANDOFF.md` — Session 002 fully documented and closed

#### Table Summary

| Table | Purpose |
|---|---|
| `amd_content_sources` | Social platform source configs (Facebook, Reddit, LinkedIn, YouTube) |
| `amd_posts` | Canonical content feed — one row per imported post, admin-published |
| `amd_users` | Platform users — UUID-based, Google OAuth, duplicate awareness |
| `amd_discussion_threads` | One thread per published post |
| `amd_discussion_posts` | User comments — pending/approved/rejected moderation flow |
| `amd_import_log` | Append-only audit log for all import events |

#### RLS Policy Summary

| Table | Platform User Policies | Admin Policy |
|---|---|---|
| `amd_content_sources` | — (read-only source configs, no user policy needed) | `amd_admin_all_content_sources` |
| `amd_posts` | Read published posts | `amd_admin_all_posts` |
| `amd_users` | Read/update own row | `amd_admin_all_users` |
| `amd_discussion_threads` | Read open threads | `amd_admin_all_discussion_threads` |
| `amd_discussion_posts` | Read approved; insert pending | `amd_admin_all_discussion_posts` |
| `amd_import_log` | — (admin-only table) | `amd_admin_all_import_log` |

#### Tasks Left Open (carried to Session 003)

- [ ] Design system proof (`design-test.html`) — establish visual tokens before building
- [ ] Build full platform frontend (feed, discussion board, admin panel, auth)
- [ ] Configure GitHub Pages custom domain (CNAME file → Hostinger DNS update)
- [ ] Decide on content source priority order (API vs RSS vs programmatic vs manual) per platform

#### Relevant Links

- Supabase Dashboard: https://supabase.com/dashboard/project/hhyhulqngdkwsxhymmcd
- Migrations: `amd_initial_schema`, `amd_admin_rls_policies` (Database > Migrations in Supabase Dashboard)
- Tutorial (Chapters 2 & 3 added): https://github.com/andredavisme/andremauricedavis.com/blob/main/TUTORIAL.md

---

### Session 003 — Design System Proof + Tutorial Chapter 4

**Date:** 2026-06-02
**Session opened:** 3:25 PM EDT
**Session closed:** 3:44 PM EDT
**Active working time:** ~19 minutes
**Actual elapsed time:** ~19 minutes

#### Decisions Made

- **Design-first methodology:** Established as the official build philosophy for this project. User experience is designed and proven before any further backend work is done. The frontend is the contract; the backend fulfills it. Documented fully in Tutorial Chapter 4.
- **Design system name:** AMD Ember
- **Primary accent:** Amber `#c97b12`
- **Secondary accent:** Warm orange `#d95e1a`
- **Display font:** Instrument Serif (editorial headings, feed card titles, chart titles)
- **Body/UI font:** Work Sans (all body copy, buttons, labels, form inputs)
- **Type scale:** Fluid using CSS `clamp()` — 8 steps from `--text-xs` to `--text-hero`. No breakpoints needed for typography.
- **Surface stack:** 6 depth levels (`--color-bg` through `--color-surface-dynamic`) with warm parchment undertones
- **Logo mark:** "A" letterform with an ember spark dot in warm orange — renders correctly at 24px, 40px, 64px, and as a wordmark
- **Dark mode:** Full dark palette defined under `[data-theme="dark"]` — all components adapt via CSS custom properties alone, no component-level changes needed
- **Chart palette (fixed order):** Amber → Orange → Gold → Rust → Brown → Success green → Notification purple → Muted. This order is mandatory for all admin-published visualizations.
- **Canonical chart types (3 approved):** Trend line (activity over time), Grouped bar (comparisons/cohorts), Donut (composition). Any other type requires explicit justification.
- **design-test.html:** Lives in repo root. Is the single source of truth for all visual decisions. Must be opened in a browser to review full fidelity including dark mode toggle.

#### Tasks Completed

- [x] Built `design-test.html` — AMD Ember design system proof with 7 sections
- [x] Generated 3 canonical chart examples in Python/Plotly using AMD Ember palette
- [x] Updated `TUTORIAL.md` — added Chapter 4 (Design-First philosophy)
- [x] Updated `HANDOFF.md` — Session 003 fully documented and closed
- [x] Added `design-test.html` reference to Infrastructure Catalog table

#### Design System Quick Reference

| Token | Value |
|---|---|
| `--color-primary` | `#c97b12` (amber) |
| `--color-orange` | `#d95e1a` (warm orange) |
| `--color-bg` | `#f8f5f0` (warm off-white) |
| `--color-surface` | `#faf7f3` |
| `--color-text` | `#1f1a13` (warm charcoal) |
| `--font-display` | `'Instrument Serif', Georgia, serif` |
| `--font-body` | `'Work Sans', 'Helvetica Neue', sans-serif` |
| Dark mode trigger | `[data-theme="dark"]` on `<html>` |

#### Relevant Links

- Tutorial (Chapter 4 added): https://github.com/andredavisme/andremauricedavis.com/blob/main/TUTORIAL.md
- Supabase Dashboard: https://supabase.com/dashboard/project/hhyhulqngdkwsxhymmcd

---

### Session 004 — Push design-test.html + Agent Protocol

**Date:** 2026-06-02
**Session opened:** 4:03 PM EDT
**Session closed:** 4:15 PM EDT (estimated)
**Active working time:** ~12 minutes
**Actual elapsed time:** ~12 minutes

#### Decisions Made

- **File push verification protocol:** After any file push, agents must verify via `list_commits` (commit message + timestamp), not by re-reading file content. File blob API can lag up to ~60 seconds behind the web UI. Full rule documented in the Agent Protocol section above.

#### Tasks Completed

- [x] Pushed `design-test.html` to repo root — all 7 sections including Section 07 canonical charts (base64 JPEG embedded). Confirmed via commit [`4062d4b`](https://github.com/andredavisme/andremauricedavis.com/commit/4062d4b47de15cf8d1ac45247c60fc1994f159ca)
- [x] Added **Agent Protocol** section to `HANDOFF.md` — file push verification rule with context note

#### Relevant Links

- design-test.html: https://github.com/andredavisme/andremauricedavis.com/blob/main/design-test.html
- Confirming commit: https://github.com/andredavisme/andremauricedavis.com/commit/4062d4b47de15cf8d1ac45247c60fc1994f159ca

---

### Session 005 — Gap 2: Cascading Source Picker in Import Tab

**Date:** 2026-06-03
**Session opened:** 2:09 PM EDT
**Session closed:** ongoing
**Active working time:** ~ongoing
**Actual elapsed time:** ~ongoing

#### Problem Statement (Gap 2)

The Import tab had a hardcoded Platform dropdown but no way to tie an imported post to a specific *source account* within that platform (e.g., "Andre Davis — Facebook Profile" vs. a group page). The `amd_posts` table has a `source_id` FK to `amd_content_sources` but the form was not populating it.

#### Decisions Made

- **Source picker is optional:** A post can be saved without a source FK. The blank "No specific source…" option is always present after a platform is selected.
- **Cascading behavior:** Source picker is disabled until a platform is selected, then filters `amd_content_sources` by `platform` and `is_active = true`. Sources are fetched once on page load and cached in `allSources[]` to avoid repeated DB calls.
- **Auto-select:** If only one source exists for the chosen platform, it is auto-selected and its `import_method` is mirrored to the Import Method dropdown.
- **Sync on source change:** Changing the source also updates the Import Method dropdown to match `amd_content_sources.import_method` — prevents method/source mismatch.
- **Seed data:** 4 starter rows inserted into `amd_content_sources` — one per platform — so the picker is functional from day one.
- **Clear behavior:** Clicking "Clear" resets the source picker to its disabled placeholder state.

#### Tasks Completed

- [x] Seeded `amd_content_sources` with 4 rows (one per platform: Facebook, Reddit, LinkedIn, YouTube)
- [x] Updated `admin.html` — gap 2 cascading source picker implemented:
  - `loadSources()` — fetches all active sources once at page load, caches in `allSources[]`
  - `populateSourcePicker(platform)` — filters cache, builds options, handles empty state
  - Platform change listener — calls `populateSourcePicker` or resets picker
  - Source change listener — syncs `import_method` dropdown
  - `submit-import` updated to read `field-source-id` and write `source_id` to `amd_posts`
  - `clear-import` updated to reset source picker
- [x] Confirmed push via commit [`16d7efca`](https://github.com/andredavisme/andremauricedavis.com/commit/16d7efcae28a033cf1d03fd8af1cc798c860b38c)
- [x] Updated `HANDOFF.md` — Session 005 documented

#### Seeded Sources

| Platform | Label | Import Method |
|---|---|---|
| facebook | Andre Davis — Facebook Profile | manual |
| reddit | u/andremauricedavis — Reddit | manual |
| linkedin | Andre Davis — LinkedIn | manual |
| youtube | Andre Davis — YouTube Channel | manual |

#### Tasks Left Open (carried to Session 006)

- [ ] Schema data inventory — audit `amd_posts` and `amd_content_sources` against design proof requirements
- [ ] Build the public-facing content feed page (`feed.html` or integrated into `index.html`)
- [ ] Build the discussion thread view
- [ ] Configure GitHub Pages custom domain (CNAME file → Hostinger DNS update)
- [ ] Decide on content source priority order (API vs RSS vs programmatic vs manual) per platform
- [ ] Google OAuth setup (Supabase Auth provider configuration)
- [ ] Gap 3+ audit — identify next admin.html or frontend gaps to close

#### Relevant Links

- admin.html (updated): https://github.com/andredavisme/andremauricedavis.com/blob/main/admin.html
- Confirming commit: https://github.com/andredavisme/andremauricedavis.com/commit/16d7efcae28a033cf1d03fd8af1cc798c860b38c
- Supabase amd_content_sources: https://supabase.com/dashboard/project/hhyhulqngdkwsxhymmcd/editor (query: `SELECT * FROM amd_content_sources`)

---

## Time Summary

| Session | Date | Open | Close | Active | Elapsed |
|---|---|---|---|---|---|
| 001 | 2026-06-02 | 10:26 AM EDT | 10:35 AM EDT | ~9 min | ~9 min |
| 002 | 2026-06-02 | 11:42 AM EDT | 12:04 PM EDT | ~22 min | ~22 min |
| 003 | 2026-06-02 | 3:25 PM EDT | 3:44 PM EDT | ~19 min | ~19 min |
| 004 | 2026-06-02 | 4:03 PM EDT | ~4:15 PM EDT | ~12 min | ~12 min |
| 005 | 2026-06-03 | 2:09 PM EDT | ongoing | ~ongoing | ~ongoing |
| **Total** | | | | **~62 min + Session 005** | |

---

*Last updated: 2026-06-03 by agent — Session 005 in progress.*
