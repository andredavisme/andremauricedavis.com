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

## Chapter 2 — The Database Schema (Session 002)

### What Is a Schema?

In everyday English, "schema" just means *structure* or *blueprint*. In database terms, it describes the tables you've created and how they're organized — their columns, data types, relationships, and rules.

Designing a schema before writing any code is like drawing a floor plan before building a house. You can still change it later, but the better your blueprint, the less demolition work you'll need to do.

### The Six Tables

We created six tables, each serving a distinct role:

| Table | One-Sentence Description |
|---|---|
| `amd_content_sources` | Where content comes from — one row per social platform (Facebook, Reddit, etc.) |
| `amd_posts` | The content itself — one row per imported post, admin-approved before appearing on the site |
| `amd_users` | Everyone who logs in — identified by a UUID, not their email address |
| `amd_discussion_threads` | One conversation space per published post |
| `amd_discussion_posts` | Individual comments inside a thread, subject to admin moderation |
| `amd_import_log` | A permanent audit trail — every import attempt is recorded here, including errors |

### Why These Six, and Not More or Fewer?

Each table represents a distinct *thing* in our system. This principle is called **normalization** — you don't want to repeat information across rows, and you don't want to cram unrelated things into the same table.

For example, the platform name "Facebook" doesn't need to be typed into every post row. Instead, `amd_posts` stores a reference (a **foreign key**) to the `amd_content_sources` table. If Facebook changes its name tomorrow, we update it in one place.

Think of it like a restaurant: the menu (sources), the orders (posts), the customers (users), the tables (threads), the conversations (discussion posts), and the kitchen log (import log) are all separate concerns.

### What Is a UUID?

A **UUID** (Universally Unique Identifier) is a randomly generated 128-bit number that is, for all practical purposes, guaranteed to be unique — even if millions of records are created simultaneously across different servers.

Example: `550e8400-e29b-41d4-a716-446655440000`

We use UUIDs as the primary key (the unique identifier) for every row in every table. We also use UUIDs for users instead of their email address — more on that in Chapter 6.

### What Is a Primary Key?

Every table has a **primary key** — a column (or combination of columns) that uniquely identifies each row. No two rows can share the same primary key value.

In all six of our tables, the primary key is a UUID column called `id` (or a similarly named UUID column). When another table needs to reference a row in this table, it stores that UUID — this is called a **foreign key**.

Example: every `amd_discussion_posts` row has a `thread_id` column. That UUID points to a specific row in `amd_discussion_threads`. This is how the two tables are connected.

### What Is a Timestamp?

Most of our tables include `created_at` and `updated_at` columns. These are **timestamps** — they record the exact date and time (down to the millisecond, with timezone) that a row was created or last changed.

The database fills these in automatically:
- `created_at` uses `DEFAULT now()` — it captures the current time when the row is first inserted
- `updated_at` uses a **trigger** — a tiny piece of logic that runs automatically every time a row is updated, setting `updated_at` to the current time

Timestamps are critical for analytics (when did people engage?), debugging (when did something break?), and moderation (when was this comment posted?).

### What Is a Database Trigger?

A **trigger** is an automatic action that the database performs when something happens — in our case, when a row is updated.

We created a shared trigger function called `amd_set_updated_at()`. It does one thing: set the `updated_at` column to `now()`. We then attached this trigger to every table that has an `updated_at` column.

Without a trigger, you'd have to remember to update `updated_at` manually every time your application changes a row. Triggers remove that human error risk entirely.

### What Is JSONB?

Most database columns store a single, typed value — text, a number, a date. **JSONB** is a special column type that stores an entire JSON object (a flexible collection of key-value pairs) in a single column.

We use a JSONB column called `attributes` on both `amd_posts` and `amd_discussion_posts`. This is where we store flexible metadata — things like engagement counts, tags, sentiment scores, or platform-specific fields that don't fit neatly into a fixed column.

The advantage: we don't have to redesign the table every time we want to track something new. We just add a new key to the JSON object.

The tradeoff: JSONB data is less strictly typed, so you have to be more careful when querying it. We use a **GIN index** on the `attributes` column to make those queries fast.

### What Is an Index?

An **index** is a data structure the database builds alongside a table to make lookups faster — similar to the index in the back of a book.

Without an index, finding all posts from a specific platform requires scanning every single row. With an index on `platform`, the database jumps directly to the relevant rows.

We created indexes on the most commonly queried columns: `platform`, `is_published`, `source_id`, `user_id`, and the JSONB `attributes` field. Every index speeds up reads but slightly slows down writes (because the index must be updated too). For a content platform like ours, read speed is more important.

### What Is an Enum?

An **enum** (enumerated type) is a column that can only contain one of a predefined set of values. It's the database equivalent of a dropdown menu.

Example: `amd_discussion_posts.status` can only be `'pending'`, `'approved'`, or `'rejected'`. The database will reject any attempt to insert a different value.

This prevents data quality problems. If you relied on plain text, someone might type `'Approved'` (capital A), `'approve'`, or `'yes'` — and your queries would silently miss those rows.

### What Is a Migration?

A **migration** is a versioned, named SQL file that changes the database schema. Instead of making changes directly in a GUI, you write the change as SQL, give it a name, and apply it.

Migrations are tracked in the database (Supabase records each one in a migrations table). This means:
- You always know exactly what state the database is in
- Changes are reproducible — you can rebuild the database from scratch by replaying all migrations in order
- The history is visible to any agent working on the project

Our first migration was named `amd_initial_schema`. Our second was `amd_admin_rls_policies`. Names are descriptive so the history reads like a story.

---

## Chapter 3 — Security: Row Level Security and Admin Access (Session 002)

### What Is Row Level Security (RLS)?

By default, if you gave someone a key to your database, they could read or change every row in every table. **Row Level Security** (RLS) is a PostgreSQL feature that lets you attach rules directly to each table controlling *who* can see or change *which rows*.

Think of RLS like a hotel key card system. The front desk controls which rooms each key can open. Even if someone steals a key card, it only opens the rooms it was programmed for.

In Supabase, enabling RLS on a table makes it **deny all access by default**. You then add **policies** — explicit rules that grant specific access. If no policy matches a request, the request is blocked.

We enabled RLS on all six `amd_` tables immediately when creating them. This is the correct order of operations: enable RLS first, then add policies. Never leave a table without RLS enabled on a public-facing Supabase project.

### What Is a Policy?

A **policy** is a rule attached to a table that says: *"Under these conditions, this type of user can perform this type of operation on these rows."*

Policies have four parts:
1. **Name** — a human-readable identifier (e.g., `amd_platform_users_read_posts`)
2. **Command** — which operation: SELECT, INSERT, UPDATE, DELETE, or ALL
3. **USING expression** — a condition that must be true for the row to be *visible* (applies to SELECT, UPDATE, DELETE)
4. **WITH CHECK expression** — a condition that must be true for a row to be *written* (applies to INSERT, UPDATE)

Example: our policy that lets platform users read published posts looks like this in plain English:
> "Allow authenticated users to SELECT rows from `amd_posts` where `is_published = true`."

### PERMISSIVE vs. RESTRICTIVE Policies

Policies in PostgreSQL come in two flavors:

- **PERMISSIVE** — "If this condition is true, allow access." Multiple PERMISSIVE policies on the same table are combined with OR — if *any* policy allows access, the operation goes through.
- **RESTRICTIVE** — "Even if another policy allows access, this condition must *also* be true." These act as mandatory filters.

All of our policies are PERMISSIVE. This is important because it means our **platform user policies** and **admin policies** can coexist on the same table without conflict. An admin user will match the admin policy, which grants full access. A regular user will match only the platform user policy, which is more limited.

### What Is `auth.uid()`?

`auth.uid()` is a built-in Supabase function that returns the UUID of the currently authenticated user — the person who made the API request. It's the bridge between your application's login system and your database's security rules.

When a user logs in through Google OAuth (more on this in Chapter 6), Supabase issues them a session token. Every subsequent database request includes that token, and `auth.uid()` extracts the user's identity from it.

This is why we use UUIDs for user identity — the same UUID that the auth system assigns is what we store in `amd_users.id`, allowing us to join authentication data with application data without ever storing an email address.

### The Admin Check: `amd_is_admin()`

Rather than repeat the same admin check logic in every single policy, we created a reusable **function** called `amd_is_admin()`. It does one thing:

```sql
SELECT EXISTS (
  SELECT 1
  FROM amd_users
  WHERE id = auth.uid()
    AND role = 'admin'
);
```

In plain English: "Is the current user's UUID in the `amd_users` table with a role of `'admin'`? If yes, return true. Otherwise, false."

Every admin policy simply calls this function:
```sql
CREATE POLICY "amd_admin_all_posts"
  ON amd_posts FOR ALL
  USING (amd_is_admin())
  WITH CHECK (amd_is_admin());
```

This pattern has three advantages:
1. **Single source of truth** — if the admin logic ever needs to change, you change it in one place
2. **Readability** — policies are short and self-documenting
3. **Performance** — the function is marked `STABLE`, meaning the database can cache the result within a single query rather than re-evaluating it for every row

### What Does `SECURITY DEFINER` Mean?

Normally, a SQL function runs with the permissions of the user calling it. A regular platform user calling `amd_is_admin()` would be querying `amd_users` with their own (limited) permissions.

`SECURITY DEFINER` changes this: the function runs with the permissions of the **owner** (the database superuser who created it). This is necessary because platform users don't have direct SELECT access to `amd_users` rows other than their own — but the admin check needs to query the table regardless.

Think of it like a security guard checking a list. The guard (the function) has access to the full list of authorized personnel (the `amd_users` table). You don't need access to that list yourself — you just wait for the guard to check and tell you yes or no.

`SECURITY DEFINER` functions should always include `SET search_path = public` to prevent a specific class of security vulnerability called a search path attack. We included that on `amd_is_admin()`.

### Promoting a User to Admin

To make someone an admin, an existing admin simply updates their row in `amd_users`:

```sql
UPDATE amd_users SET role = 'admin' WHERE id = '<their-uuid>';
```

No code changes. No redeployment. The RLS policy evaluates in real time — the next request they make will be evaluated as an admin.

### The Import Log: An Admin-Only Table

The `amd_import_log` table has no platform user policies at all — only the admin policy. Regular users can never see it. This is intentional: the import log contains operational details (error messages, row counts, trigger types) that are only relevant to the person running the platform.

This is an example of a general principle: **the absence of a policy is a security decision, not an oversight.** With RLS enabled, tables without a matching policy are silently inaccessible — they don't return an error, they just return zero rows. This behavior is intentional and is one of the reasons RLS is so powerful.

---

## Upcoming Chapters (To Be Written)

- **Chapter 4 — The Design System** — visual tokens, color, typography
- **Chapter 5 — The Content Feed** — building the public-facing feed
- **Chapter 6 — Discussion Threads** — tying conversations to content
- **Chapter 7 — User Authentication** — Google OAuth + UUID tracking
- **Chapter 8 — The Admin Panel** — importing, moderating, analyzing
- **Chapter 9 — Community Analytics** — cohorts, visualizations, critical thinking tools
- **Chapter 10 — Going Live** — pointing the domain, replacing the Hostinger files

---

*Last updated: 2026-06-02 — Session 002 (Chapters 2 & 3 added)*
