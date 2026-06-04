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
| Auth Portal Repo | https://github.com/andredavisme/amd-auth |
| Auth Portal Domain | https://auth.andremauricedavis.com |

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

### Session 005 — Credential Audit (Gaps 3 & 4) + Gap 5 Diagnosis + Gap 6 Assessment

**Date:** 2026-06-03
**Session opened:** 2:09 PM EDT
**Session closed:** 2:29 PM EDT
**Active working time:** ~20 minutes
**Actual elapsed time:** ~20 minutes

#### Problem Statement

A credential mismatch was introduced in a prior session: `amd-auth.js` and `admin.html` contained Supabase publishable keys from the wrong project. Additionally, Google OAuth had never been enabled on the correct Supabase project, blocking all user login. The feed stack (`feed.html` + `amd-feed.js`) was also assessed to determine if it was build-complete.

#### Decisions Made

- **Correct Supabase project credentials:** URL = `https://hhyhulqngdkwsxhymmcd.supabase.co`, Key = `sb_publishable_haKvwV0M7KMj4Qz69M6WGg_KmIfU-aI`. Any file containing different credentials is wrong and must be corrected.
- **Gap numbering convention established:** Gaps are incremental issue identifiers tracked across sessions. Gaps 3 and 4 were credential fixes. Gap 5 is Google OAuth config (manual). Gap 6 is first published post (data gap, not code).
- **Gap 5 is manual:** Google OAuth provider must be enabled in the Supabase Auth dashboard and a Google Cloud Console OAuth 2.0 client must be created. Cannot be done programmatically by an agent.
- **Gap 6 is a data gap:** `feed.html` and `amd-feed.js` are fully built and correct. The feed shows "No posts yet" because `amd_posts` has no `is_published = true` rows. Gap 6 is closed by importing and publishing one post via `admin.html` after gap 5 (OAuth) is working.
- **`login.html` and `feed.html` are clean:** Both import from `amd-auth.js` and contain no hardcoded credentials. Only `admin.html` had the wrong key.

#### Tasks Completed

- [x] **Gap 3** — Fixed `js/amd-auth.js`: corrected both `SUPABASE_URL` and `SUPABASE_KEY` to match project `hhyhulqngdkwsxhymmcd`. Confirmed via commit [`9bc7708`](https://github.com/andredavisme/andremauricedavis.com/commit/9bc770857c6ec11e8056fe71c6500a2bc8787307)
- [x] **Gap 4** — Fixed `admin.html`: corrected `SUPABASE_KEY` (URL was already correct, key was from wrong project). Confirmed via commit [`96d3baa`](https://github.com/andredavisme/andremauricedavis.com/commit/96d3baabf82296a079e2fb99c0f89bece52237d8)
- [x] **Gap 5 diagnosed** — Auth logs confirmed `"provider is not enabled"` for Google OAuth on project `hhyhulqngdkwsxhymmcd`. Handed off to user with full step-by-step instructions (see below).
- [x] **Gap 6 assessed** — `feed.html` and `js/amd-feed.js` verified as fully built. Gap 6 is a data task: import + publish one post via admin panel once OAuth works.

#### Gap 5 — Google OAuth Manual Setup Instructions

> **To be completed by user (cannot be done by agent).**

**Step 1 — Google Cloud Console:**
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create or select a project (e.g. "AMD Platform")
3. APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID
4. Application type: Web application
5. Authorized redirect URI: `https://hhyhulqngdkwsxhymmcd.supabase.co/auth/v1/callback`
6. Copy Client ID and Client Secret

**Step 2 — Supabase Auth Dashboard:**
1. Go to: https://supabase.com/dashboard/project/hhyhulqngdkwsxhymmcd/auth/providers
2. Find Google → Enable → paste Client ID and Client Secret → Save

**Step 3 — Supabase Redirect URL Allowlist:**
1. In Auth → URL Configuration, add:
   - `https://andredavisme.github.io/andremauricedavis.com/feed.html`
   - `https://andremauricedavis.com/feed.html`
   - `http://localhost:*/feed.html`

#### Credential Audit — Final State

| File | URL | Key | Status |
|---|---|---|---|
| `js/amd-auth.js` | `hhyhulqngdkwsxhymmcd` | `haKvwV0M…` | ✅ Correct |
| `admin.html` | `hhyhulqngdkwsxhymmcd` | `haKvwV0M…` | ✅ Fixed gap 4 |
| `login.html` | imports `amd-auth.js` | — | ✅ No hardcoded creds |
| `feed.html` | imports `amd-auth.js` | — | ✅ No hardcoded creds |
| `thread.html` | imports `amd-auth.js` | — | ✅ No hardcoded creds |

#### Tasks Left Open (carried to Session 006)

- [ ] **Gap 5** — Enable Google OAuth on Supabase project `hhyhulqngdkwsxhymmcd` (manual — user action required, instructions above)
- [ ] **Gap 6** — Import and publish first post via `admin.html` to verify full feed pipeline end-to-end (requires gap 5 complete)
- [ ] **Gap 7** — Verify `thread.html` end-to-end: click Discuss on a feed card → thread loads → user can submit a reply → reply appears in Steward pending queue → admin approves → reply visible on thread
- [ ] Configure GitHub Pages custom domain (CNAME file → Hostinger DNS update)
- [ ] Decide on content source priority order (API vs RSS vs programmatic vs manual) per platform
- [ ] `amd_users` provisioning — confirm that a new Google OAuth login auto-creates a row in `amd_users` (or add a trigger/edge function to do so)

#### Relevant Links

- Gap 3 fix commit: https://github.com/andredavisme/andremauricedavis.com/commit/9bc770857c6ec11e8056fe71c6500a2bc8787307
- Gap 4 fix commit: https://github.com/andredavisme/andremauricedavis.com/commit/96d3baabf82296a079e2fb99c0f89bece52237d8
- Supabase Auth Providers: https://supabase.com/dashboard/project/hhyhulqngdkwsxhymmcd/auth/providers
- feed.html: https://github.com/andredavisme/andremauricedavis.com/blob/main/feed.html
- js/amd-feed.js: https://github.com/andredavisme/andremauricedavis.com/blob/main/js/amd-feed.js
- admin.html: https://github.com/andredavisme/andremauricedavis.com/blob/main/admin.html

---

### Session 006 — Unified Auth Portal + Cross-Property Redirects

**Date:** 2026-06-04
**Session opened:** 8:20 AM EDT
**Session closed:** 9:27 AM EDT
**Active working time:** ~67 minutes
**Actual elapsed time:** ~67 minutes

#### Problem Statement

Google OAuth on `andremauricedavis.com` was redirecting to another property in the shared Supabase project, creating confusion and blocking a clean cross-property auth experience. The user decided the correct long-term architecture is a dedicated landing-page auth portal that can serve current and future properties.

#### Decisions Made

- **Canonical auth entry point:** `https://auth.andremauricedavis.com` is now the dedicated unified auth portal for all AMD properties.
- **Architecture direction:** Every protected property redirects unauthenticated users to the auth portal with `?return=<current-url>`. The portal authenticates, then returns users to the origin page.
- **Auth methods at portal:** Support both Google OAuth and email/password on the portal so different projects can share one sign-in surface.
- **Shared Supabase project:** Confirmed that both `andremauricedavis.com` and `personal-ledger-public-display` use the same Supabase project `hhyhulqngdkwsxhymmcd`.
- **Session storage strategy:** Removed custom `storageKey` usage from `andremauricedavis.com`. All AMD properties should use the Supabase default auth storage key so the portal and properties share one session model.
- **Legacy local login page:** `login.html` in `andremauricedavis.com` is retained only as a redirect shim to the auth portal for backward compatibility.
- **Manual infra completed by user during session:** Hostinger DNS for `auth.andremauricedavis.com`, GitHub Pages enablement for `amd-auth`, Supabase Site URL / redirect allowlist updates, and Google Cloud Console redirect updates were all completed.

#### Tasks Completed

- [x] Created new GitHub repo: https://github.com/andredavisme/amd-auth
- [x] Built `amd-auth/index.html` — AMD Ember portal UI with Google OAuth, email/password sign-in, `?return=` handling, origin allowlist, and dark mode toggle
- [x] Added `CNAME` to `amd-auth` for `auth.andremauricedavis.com`
- [x] Added `README.md` in `amd-auth` documenting how future properties join the portal
- [x] Updated `andremauricedavis.com/js/amd-auth.js` to remove local Google OAuth flow and redirect unauthenticated users to the auth portal
- [x] Removed custom `storageKey` override from `andremauricedavis.com/js/amd-auth.js`
- [x] Updated `personal-ledger-public-display/assets/js/auth.js` to replace local login modal with portal redirect
- [x] Converted `andremauricedavis.com/login.html` into an instant redirect shim to `https://auth.andremauricedavis.com`

#### Commits

| Commit | Repo | Purpose |
|---|---|---|
| [`363daff`](https://github.com/andredavisme/amd-auth/commit/363daff237cf5eb442169ec37717bff182636330) | `amd-auth` | Initial auth portal — AMD Ember design, Google + email/password, `?return=` handling |
| [`24bf6d3`](https://github.com/andredavisme/andremauricedavis.com/commit/24bf6d3f96705d3ac3a1b5cdfc543b7cf985b0ca) | `andremauricedavis.com` | Replace local OAuth with `auth.andremauricedavis.com` portal redirect |
| [`2b67a73`](https://github.com/andredavisme/personal-ledger-public-display/commit/2b67a73d2d9374e6207a9584df46e74e2efd8adf) | `personal-ledger-public-display` | Replace local auth modal with portal redirect |
| [`2e7f572`](https://github.com/andredavisme/andremauricedavis.com/commit/2e7f572931e2e502ef3f810728076c8f2f94d37b) | `andremauricedavis.com` | Convert `login.html` to instant redirect shim |

#### Tasks Left Open (carried to Session 007)

- [ ] **Gap 6** — Import and publish first post via `admin.html` to verify the full feed pipeline end-to-end
- [ ] **Gap 7** — Verify `thread.html` end-to-end: click Discuss on a feed card → thread loads → user can submit a reply → reply appears in Steward pending queue → admin approves → reply visible on thread
- [ ] **Unified auth testing** — Test the full redirect flow end-to-end after DNS propagation: AMD site → auth portal → return; ledger → auth portal → return
- [ ] **Portal hardening** — Confirm allowlist entries are complete for every current property and trim any temporary localhost/testing entries later
- [ ] Decide on content source priority order (API vs RSS vs programmatic vs manual) per platform
- [ ] `amd_users` provisioning — confirm that first login through the portal auto-creates a row in `amd_users` on protected AMD pages and decide whether that logic belongs in app code, trigger, or edge function

#### Relevant Links

- Auth Portal Repo: https://github.com/andredavisme/amd-auth
- Auth Portal Domain: https://auth.andremauricedavis.com
- Auth Portal initial commit: https://github.com/andredavisme/amd-auth/commit/363daff237cf5eb442169ec37717bff182636330
- AMD portal redirect commit: https://github.com/andredavisme/andremauricedavis.com/commit/24bf6d3f96705d3ac3a1b5cdfc543b7cf985b0ca
- Ledger portal redirect commit: https://github.com/andredavisme/personal-ledger-public-display/commit/2b67a73d2d9374e6207a9584df46e74e2efd8adf
- login.html redirect shim commit: https://github.com/andredavisme/andremauricedavis.com/commit/2e7f572931e2e502ef3f810728076c8f2f94d37b
- Supabase Auth URL Configuration: https://supabase.com/dashboard/project/hhyhulqngdkwsxhymmcd/auth/url-configuration
- Supabase Auth Providers: https://supabase.com/dashboard/project/hhyhulqngdkwsxhymmcd/auth/providers

---

## Time Summary

| Session | Date | Open | Close | Active | Elapsed |
|---|---|---|---|---|---|
| 001 | 2026-06-02 | 10:26 AM EDT | 10:35 AM EDT | ~9 min | ~9 min |
| 002 | 2026-06-02 | 11:42 AM EDT | 12:04 PM EDT | ~22 min | ~22 min |
| 003 | 2026-06-02 | 3:25 PM EDT | 3:44 PM EDT | ~19 min | ~19 min |
| 004 | 2026-06-02 | 4:03 PM EDT | ~4:15 PM EDT | ~12 min | ~12 min |
| 005 | 2026-06-03 | 2:09 PM EDT | 2:29 PM EDT | ~20 min | ~20 min |
| 006 | 2026-06-04 | 8:20 AM EDT | 9:27 AM EDT | ~67 min | ~67 min |
| **Total** | | | | **~149 min** | |

---

*Last updated: 2026-06-04 by agent — Session 006 closed.*
