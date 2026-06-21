# Taba Backend Schema Setup

Backend-only work. No UI changes. Enables Lovable Cloud (Supabase) and creates exactly the four tables you specified via a single migration.

## Step 1 — Enable Lovable Cloud

Required to provision the Postgres database. No external accounts needed.

## Step 2 — Migration: create the four tables

Exact columns as specified, no extras. Each public table gets GRANTs + RLS enabled.

### `accounts`
- `id` uuid PK default `gen_random_uuid()`
- `name` text NOT NULL
- `role` text
- `industry` text
- `linkedin_handle` text
- `languages` text[]
- `created_at` timestamptz default `now()`

### `events`
- `id` uuid PK default `gen_random_uuid()`
- `name` text NOT NULL
- `date_start` date
- `date_end` date
- `event_code` text NOT NULL UNIQUE
- `created_at` timestamptz default `now()`

### `event_memberships`
- `id` uuid PK default `gen_random_uuid()`
- `account_id` uuid NOT NULL → `accounts(id)` ON DELETE CASCADE
- `event_id` uuid NOT NULL → `events(id)` ON DELETE CASCADE
- `goal_tags` text[]
- `looking_for` text
- `give_back` text
- `open_to_connect` boolean default `true`
- `joined_at` timestamptz default `now()`
- UNIQUE `(account_id, event_id)`

### `messages`
- `id` uuid PK default `gen_random_uuid()`
- `event_id` uuid NOT NULL → `events(id)` ON DELETE CASCADE
- `sender_membership_id` uuid NOT NULL → `event_memberships(id)` ON DELETE CASCADE
- `recipient_membership_id` uuid NOT NULL → `event_memberships(id)` ON DELETE CASCADE
- `body` text NOT NULL
- `sent_at` timestamptz default `now()`

## Relationships

```text
accounts 1───< event_memberships >───1 events
                      │  │
                      │  └──< messages.recipient_membership_id
                      └─────< messages.sender_membership_id
messages >───1 events
```

## Security note (open question)

Taba has no authentication yet, so I can't scope RLS policies to `auth.uid()`. Two options — please pick one before I run the migration:

1. **Enable RLS, no policies yet** (recommended). Tables are locked down; we add policies when we add auth/identity in a later step. Safe default, but the app can't read/write until policies exist.
2. **Enable RLS with permissive `anon`+`authenticated` policies** so you can poke at the schema from the client immediately. Not safe for real data — only use for very short-term prototyping.

Default if you don't specify: **option 1**.

## Verification

After the migration runs I'll show you the final schema (columns, FKs, unique constraints) pulled from the database so you can verify before any UI work.

## Out of scope

No UI, no seed data, no extra columns, no auth wiring — strictly the four tables above.
