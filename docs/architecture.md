# BotBuilder Uz Architecture Notes

## Overview
- Next.js 16 App Router handles the UI, server actions, and Telegram webhook routes.
- Supabase Auth is the primary authentication layer for email/password sign-up and sign-in.
- Supabase PostgreSQL stores tenant data with RLS scoped by `workspace_id`.
- A reusable direct PostgreSQL module under `lib/db/` is used for scripts and low-level connection checks against `umarxonsdb`.

## Tenancy Model
- MVP scope is one workspace per user.
- Every business table carries `workspace_id`.
- `workspace_members` is kept even in the MVP to support a smooth upgrade path to multi-member workspaces later.
- RLS uses `public.is_workspace_member(workspace_id)` so authenticated users only see their own tenant data.

## Runtime Split
- Supabase client:
  Used for dashboard reads, auth-aware server rendering, and user-scoped data operations.
- Supabase service role client:
  Used for privileged server actions such as workspace provisioning, encrypted token storage, publishing flows, broadcasts, and webhook processing.
- Direct PostgreSQL module:
  Used for scripts like `db:check` and `db:seed`, and can be reused for future migrations or reporting jobs.

## Telegram Flow Engine
- Workspace bot token is verified via Telegram `getMe`.
- Bot token is encrypted before being persisted in `bot_connections`.
- Webhook security uses Telegram's `x-telegram-bot-api-secret-token` header and a stored hash.
- Published flow execution loads nodes and buttons from the database, then drives menu navigation, lead capture, and order capture using `bot_users.session_state`.

## Extension Path
- Multi-bot support:
  Remove the unique `workspace_id` constraint from `bots` and adjust UI routing.
- Versioned publishing:
  Duplicate flows instead of mutating a single draft.
- Background delivery:
  Move broadcasts to a queue/worker model for larger audiences.
- Richer analytics:
  Add materialized views or background aggregation for higher-volume tenants.
