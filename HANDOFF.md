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

## Time Summary

| Session | Date | Open | Close | Active | Elapsed |
|---|---|---|---|---|---|
| 001 | 2026-06-02 | 10:26 AM EDT | 10:35 AM EDT | ~9 min | ~9 min |
| 002 | 2026-06-02 | 11:42 AM EDT | 12:04 PM EDT | ~22 min | ~22 min |
| **Total** | | | | **~31 min** | **~31 min** |

---

*Last updated: 2026-06-02 by agent — Session 002 closed.*
