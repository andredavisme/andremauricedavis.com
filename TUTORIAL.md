# andremauricedavis.com — Build Tutorial

> **Purpose:** This document explains the *why* and *how* of every decision made during the build of this platform. It is written for someone with zero prior experience in web development, databases, or community platform architecture — but it also serves as a technical reference manual for anyone building something similar.
>
> This document is updated at the **beginning and end of every task** with the goal of making the development process an educational experience. If you follow along, you will understand not just what was built, but why every choice was made.

---

## What Are We Building?

Imagine you post content across Facebook, Reddit, LinkedIn, and YouTube. Each platform has its own audience, its own algorithm, and its own way of organizing conversations. You have no control over how those platforms present your content, and your community is fragmented across all four.

This project consolidates all of that into **one platform you own and control** — a single feed of your content, a discussion board tied to each piece, and an analytics layer that lets you study your community's behavior over time.

Think of it like building your own magazine: you're the editor, the content comes from your existing social channels, and your readers can discuss everything in one place.

---

## The Big Picture: How It Works

```
Social Platforms                Admin Pipeline                 Your Platform
─────────────────    ──────────────────────────────    ─────────────────────────
Facebook             API / RSS (preferred)             Public Feed
Reddit          →    Programmatic scrape (secondary) → Discussion Threads
LinkedIn             Manual import (last resort)        Community Analytics
YouTube                                                 Admin Panel
```

1. Content is pulled from social platforms and stored in a **database** (Supabase)
2. An **admin** reviews and approves what appears on the platform
3. **Platform users** log in with Google and can discuss any piece of content
4. The **analytics layer** lets the admin study patterns in the community

---

## Chapter 1 — The Foundation (Session 001)

### What Is a Repository?

A **repository** (or "repo") is like a project folder that lives on the internet and tracks every change ever made to your files. We use **GitHub** to host ours.

Every change is called a **commit** — a snapshot of the project at a point in time. This means if something breaks, you can go back to any previous snapshot. It also means every decision leaves a paper trail.

Our repo is at: https://github.com/andredavisme/andremauricedavis.com

### Why GitHub Pages?

**GitHub Pages** is a free hosting service that automatically publishes your website directly from your GitHub repository. Every time you push a change to the `main` branch, the live site at `https://andredavisme.github.io/andremauricedavis.com` updates automatically.

This is how we develop and review the site without touching the production domain (`andremauricedavis.com`) until we're ready.

### What Is a Database?

A **database** is an organized system for storing and retrieving information. We use **Supabase**, which is a cloud-hosted database built on PostgreSQL (one of the world's most reliable database systems).

Think of the database as a collection of spreadsheets (called **tables**) that can talk to each other. Each row is a record, each column is an attribute. For example, the `amd_posts` table will have one row per imported social post, with columns like `platform`, `title`, `published_at`, and `source_url`.

### Why the `amd_` Prefix?

Our Supabase project is shared with other applications built by the same developer. There are already over 100 tables in the database for other projects. If we named our table `posts`, it might conflict with an existing `posts` table from a different project.

By prefixing every table name with `amd_` (for **A**ndré **M**aurice **D**avis), we create a clear namespace. It's like putting your name on your lunchbox in a shared refrigerator.

We *could* use a separate **schema** (a namespace built into PostgreSQL) — but in this shared Supabase project, using non-public schemas has caused authentication issues in the past. So we stay in the `public` schema and use naming conventions instead.

### The Three Documents

Every session on this project maintains three living documents:

| Document | What It Is |
|---|---|
| `HANDOFF.md` | The session log — what was done, what's open, timestamps |
| `TUTORIAL.md` | This file — the educational walkthrough |
| `CATALOG.md` | The quick-reference card for infrastructure details |

These documents are **always the first thing an agent reads** when starting a session, and **the last thing updated** before closing.

### Time Tracking

Each session in the Handoff document records:
- **Session opened** — when the session started
- **Session closed** — when "Close this session" was called
- **Active working time** — time spent actually working (excludes idle)
- **Actual elapsed time** — wall-clock time from open to close

A running total at the bottom of the Handoff document gives a cumulative picture of project investment.

---

## Upcoming Chapters (To Be Written)

- **Chapter 2 — The Database Schema** — designing the `amd_` tables
- **Chapter 3 — The Design System** — visual tokens, color, typography
- **Chapter 4 — The Content Feed** — building the public-facing feed
- **Chapter 5 — Discussion Threads** — tying conversations to content
- **Chapter 6 — User Authentication** — Google OAuth + UUID tracking
- **Chapter 7 — The Admin Panel** — importing, moderating, analyzing
- **Chapter 8 — Community Analytics** — cohorts, visualizations, critical thinking tools
- **Chapter 9 — Going Live** — pointing the domain, replacing the Hostinger files

---

*Last updated: 2026-06-02 — Session 001*