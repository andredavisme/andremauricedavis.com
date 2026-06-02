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

## Chapter 4 — Design First: Building to User Expectation (Session 003)

### The Core Principle: Start With the End Experience

Most first-time builders make the same mistake: they build the backend first — the database, the API, the import pipeline — and then figure out what the frontend needs to look like afterward. The result is a platform that works technically but feels like it was designed by the database, not by a human.

The correct order is the reverse: **design the experience you want users to have first, then build the backend to serve it.**

This is not just an aesthetic preference. It has direct technical consequences. When you design first, you discover what data you actually need before you write a single line of backend code. You find out that the feed card needs a post thumbnail, a source badge, a truncated excerpt, and a reply count — and that informs exactly what columns your `amd_posts` table needs to expose. Nothing more, nothing less.

Design first is a form of **requirement gathering through visual thinking**. It externalizes your assumptions about the user experience so they can be tested, challenged, and refined *before* they are baked into infrastructure.

Think of it this way: if you build a house and realize after the walls are up that the kitchen should have been on the other side, moving it is expensive. But if you realize that on a floor plan, it costs nothing.

### What Is a Design System?

A **design system** is a collection of reusable decisions — colors, fonts, spacing, component shapes — that define how every part of a platform looks and behaves. It is not a finished design; it is the *vocabulary* that all finished designs will be written in.

The analogy: a design system is a set of Lego brick molds. Individual pages are built from those bricks. If every brick follows the same mold, the pages feel cohesive. If each developer invents their own brick shapes, the platform feels fragmented and unprofessional — even if every individual piece works.

Our design system for this platform is called **AMD Ember**. It consists of:

| Token Category | Decision Made |
|---|---|
| **Color palette** | Warm off-white surfaces; amber (`#c97b12`) as primary accent; warm orange (`#d95e1a`) as secondary |
| **Typography** | Instrument Serif for display headings and editorial content titles; Work Sans for all UI, body copy, labels, and buttons |
| **Spacing scale** | A fixed set of spacing values (0.25rem to 8rem) — all spacing in the platform uses only these values |
| **Type scale** | A fixed set of font sizes using `clamp()` — they scale fluidly with viewport width |
| **Component shapes** | Border radii, shadow depths, button and badge styles |
| **Data visualization** | A fixed color order for charts, ensuring all analytics visuals feel like they belong to the same system |

Every one of these is defined as a **CSS custom property** (also called a CSS variable). This means the entire platform can be reskinned by changing values in one place, and dark mode is handled automatically by redefining those variables under a different selector.

### What Is a Design Proof?

A **design proof** (also called a design token test or a style tile) is a single HTML file that demonstrates all of the design system's decisions in one place — *before any real pages are built*.

It is not a mockup of a real page. It is a catalog: here are the surface layers, here are the fonts at every size, here is what a feed card looks like, here is what a button looks like in every state, here is how a chart is styled. Think of it as the swatchbook a painter shows you before they pick up a brush.

We built `design-test.html` as our design proof. It contains seven sections:

| Section | What It Demonstrates |
|---|---|
| Surface Layers | The six background depths, from page background to active state |
| Type Specimen | Every font size and weight, clearly labeled with its CSS variable |
| Text Contrast | Body text, muted text, and faint text on each surface — verifying readability |
| Logo Mark | The AMD "A with ember spark" mark at all sizes and on dark backgrounds |
| Component Sampler | Buttons, badges, form inputs, feed post card, admin stat cards |
| Accent Color Range | The full amber and orange swatch ranges with hover/active/highlight variants |
| Data Visualization | Three canonical chart types (trend line, grouped bar, donut) styled in the Ember palette |

The design proof lives in the repository alongside the rest of the codebase. Any future agent, developer, or collaborator who works on this project can open it in a browser and immediately understand the entire visual language of the platform.

### Why Design Before the Database Is "Finished"?

The database schema we built in Session 002 was intentionally minimal — just enough structure to support the core data model. Design first reveals what we *actually* need from it.

Here is a concrete example. Until we designed the feed card component, we could not know:
- Does the feed card show a thumbnail image? If yes, `amd_posts` needs an `image_url` column.
- Does it show a reply count? If yes, either `amd_posts` needs a denormalized `reply_count` column, or the frontend needs to query `amd_discussion_posts` every time it renders a card (slower and more complex).
- Does it show the source platform as a colored badge? If yes, `amd_content_sources` needs a `color` or `theme_key` column so the badge can render correctly without hardcoding platform names in the CSS.

None of these questions can be answered from the database alone. They can only be answered by looking at the actual experience a user will have and working backward.

This is the practice: **design what the user sees, then inventory what data each element requires, then verify that the schema supports it — and extend it where it doesn't.**

### How to Do It: The Design-First Workflow

Here is the step-by-step process we follow on this project:

**Step 1: Define the user's goal for each view.**
Before drawing anything, state in plain English what a user is trying to accomplish. For the feed: "A logged-in user wants to browse recent content from all platforms and find something worth discussing." This statement will act as a filter — any design element that doesn't serve that goal gets cut.

**Step 2: Sketch the information hierarchy.**
What does the user need to see first, second, third? For the feed card: (1) what the post is about, (2) where it came from, (3) how active the discussion is. Order drives layout. The most important thing gets the most visual weight.

**Step 3: Build the design proof.**
Translate the hierarchy into actual HTML and CSS using the design system tokens. No fake data yet — just real components with placeholder content. This is where typography, spacing, and color are tested at real scale in a real browser.

**Step 4: Inventory the data requirements.**
For each element in the proof, list the exact field it needs from the database. Feed card title → `amd_posts.title`. Source badge color → `amd_content_sources.color`. Reply count → aggregate of `amd_discussion_posts` where `status = 'approved'`. This inventory becomes a checklist against the existing schema.

**Step 5: Reconcile with the schema.**
Compare the inventory against what the current migrations have already created. For anything missing, write a new migration to add it. For anything in the schema that no component needs — leave it alone, it may be needed later. Never delete schema you haven't proven is useless.

**Step 6: Build the backend to match.**
Now write the backend logic — API queries, import transformations, data shapes — with the exact field names and structures the frontend already expects. The frontend is the contract; the backend fulfills it.

### Why This Order Protects You

When you build backend-first, there is a natural psychological pull to use whatever data you have. The database has a `raw_content` text blob? The frontend ends up showing that blob because it's easy. The database has a numeric `engagement_score`? The frontend gets a number instead of the meaningful breakdown that would actually tell users something.

Design-first inverts this. The frontend is built around what is *useful to the human*, not what is *convenient to the database*. The backend is then forced to do the work of transforming raw data into the shape that the human experience requires.

This is not extra work — it is the work done in the right order. The total effort is the same. The outcome is dramatically different.

### What Is a CSS Custom Property (Design Token)?

The design system stores every reusable value as a **CSS custom property**, declared in the `:root` selector so it is available everywhere in the stylesheet. Here is a simplified example:

```css
:root {
  --color-primary: #c97b12;   /* amber */
  --font-display:  'Instrument Serif', Georgia, serif;
  --space-4:       1rem;
  --radius-md:     0.5rem;
}
```

Anywhere in the CSS you want the primary amber color, you write `var(--color-primary)` instead of the hex value. This means:
- If the color needs to change, you change it in one place and every component updates
- Dark mode is handled by redefining the same variables under `[data-theme="dark"]` — the components themselves don't change at all
- Any developer working on the project can read `var(--color-primary)` and immediately understand what they're looking at, without needing to decode a hex code

This is what separates a design *system* from a design *file*. A design file stores decisions as static values. A design system stores them as living references that every component is built from.

### What Is `clamp()` and Why Does the Type Scale Use It?

Every font size in our design system is defined using `clamp()`, a CSS function that takes three values: a minimum, a preferred, and a maximum.

```css
--text-xl: clamp(1.5rem, 1.2rem + 1.25vw, 2.25rem);
```

This means:
- **Minimum:** the font will never be smaller than `1.5rem` (24px), no matter how narrow the viewport
- **Preferred:** it will scale fluidly based on viewport width (`1.2rem + 1.25vw`)
- **Maximum:** it will never be larger than `2.25rem` (36px), no matter how wide the viewport

The result is typography that looks correct on a phone, a tablet, and a wide desktop monitor without writing separate CSS for each screen size. The scale is built once and works everywhere.

This technique is called **fluid typography** and it is one of the most important advances in modern CSS. It eliminates the need for awkward breakpoints just to control font sizes.

### The Data Visualization Layer

Charts and analytics visualizations are part of the user experience — they are not a separate concern. We defined the visualization style in the design proof at the same stage as buttons and typography, not as an afterthought.

The AMD Ember chart palette follows a fixed color order:

| Order | Color | Role |
|---|---|---|
| 1 | Amber `#c97b12` | Primary series, most important metric |
| 2 | Orange `#d95e1a` | Secondary series |
| 3 | Gold `#e8a030` | Tertiary series |
| 4 | Rust `#b04010` | Quaternary series |
| 5 | Brown `#7d4904` | Fifth series |
| 6 | Success green `#3d7a2a` | Positive states, approval metrics |
| 7 | Notification purple `#8b4fd8` | Admin/special callouts |
| 8 | Muted `#8c8070` | Background/reference series |

Every chart published by the admin will use this color order. This means a reader who sees multiple charts on the platform will learn to associate amber with YouTube, orange with Reddit, and so on — because the color order is consistent. That consistency is not accidental; it is designed.

Three canonical chart types are approved for use on this platform:
- **Trend line** — for activity over time, user growth, import frequency
- **Grouped bar** — for platform comparisons, cohort analysis, moderation metrics
- **Donut** — for composition breakdowns (content type mix, source breakdown, cohort share)

Any other chart type requires explicit justification before being introduced, to prevent the admin panel from becoming a visual zoo of inconsistent formats.

---

## Upcoming Chapters (To Be Written)

- **Chapter 5 — The Content Feed** — building the public-facing feed from design proof to working HTML
- **Chapter 6 — Discussion Threads** — tying conversations to content, moderation flow
- **Chapter 7 — User Authentication** — Google OAuth + UUID tracking, no email storage
- **Chapter 8 — The Admin Panel** — importing, moderating, analyzing
- **Chapter 9 — Community Analytics** — cohorts, visualizations, critical thinking tools
- **Chapter 10 — Going Live** — pointing the domain, replacing the Hostinger files

---

*Last updated: 2026-06-02 — Session 003 (Chapter 4 added — Design First philosophy and design system proof)*
