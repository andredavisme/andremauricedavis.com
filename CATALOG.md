# andremauricedavis.com — Project Catalog

> **Purpose:** Single reference for all infrastructure, naming conventions, keys, and file locations. Referenced by agents at the start of every session.

---

## Repository

| Field | Value |
|---|---|
| Repo URL | https://github.com/andredavisme/andremauricedavis.com |
| GitHub Pages | https://andredavisme.github.io/andremauricedavis.com |
| Production Domain | https://andremauricedavis.com |
| Default Branch | `main` |
| Visibility | Public |

### Folder Structure

```
andremauricedavis.com/
├── index.html              ← Platform entry point (GitHub Pages root)
├── HANDOFF.md              ← Live session handoff document
├── TUTORIAL.md             ← Educational build walkthrough
├── CATALOG.md              ← This file — infrastructure reference
├── assets/
│   ├── css/
│   ├── js/
│   └── img/
└── admin/
    └── index.html          ← Admin panel (hash-based routing)
```

---

## Supabase

| Field | Value |
|---|---|
| Project Name | andredavisme's Project |
| Project ID / Ref | `hhyhulqngdkwsxhymmcd` |
| Region | `us-west-2` |
| API URL | `https://hhyhulqngdkwsxhymmcd.supabase.co` |
| Dashboard | https://supabase.com/dashboard/project/hhyhulqngdkwsxhymmcd |
| Anon Key (legacy JWT) | Stored in project settings — use `sb_publishable_*` for new code |
| Publishable Key | `sb_publishable_haKvwV0M7KMj4Qz69M6WGg_KmIfU-aI` |
| Schema | `public` (shared with other projects — see naming convention below) |

### Naming Convention

All tables for this project use the `amd_` prefix. **Do not use a separate schema** — auth policies and RLS behave unexpectedly outside `public` on this shared project.

### `amd_` Tables (Planned)

| Table | Purpose | Status |
|---|---|---|
| `amd_users` | UUID-based platform users (no email stored) | 🔲 Planned |
| `amd_content_sources` | Social platform source registry (FB, Reddit, LinkedIn, YT) | 🔲 Planned |
| `amd_posts` | Imported content posts with source/platform attributes | 🔲 Planned |
| `amd_discussion_threads` | Discussion threads tied to each post | 🔲 Planned |
| `amd_discussion_posts` | Individual posts within a thread | 🔲 Planned |
| `amd_post_tags` | Tag/attribute system for cohort analysis | 🔲 Planned |
| `amd_cohorts` | Admin-defined analysis cohorts | 🔲 Planned |
| `amd_visualizations` | Admin-published visualizations linked to threads | 🔲 Planned |
| `amd_import_log` | Log of all admin import actions | 🔲 Planned |

---

## Hosting

| Stage | Host | URL | Notes |
|---|---|---|---|
| Development / Review | GitHub Pages | https://andredavisme.github.io/andremauricedavis.com | Auto-deploys on push to `main` |
| Production | Hostinger | https://andremauricedavis.com | CNAME to GitHub Pages (pending DNS config) |

### GitHub Pages Setup

GitHub Pages is enabled on the `main` branch from the repo root. A `CNAME` file will be added when ready to point the custom domain.

---

## Documentation Index

| Document | Location | Purpose |
|---|---|---|
| Handoff | `HANDOFF.md` | Session history, decisions, open tasks |
| Tutorial | `TUTORIAL.md` | Educational walkthrough of the build |
| Catalog | `CATALOG.md` | Infrastructure reference (this file) |

---

*Last updated: 2026-06-02 — Session 001*