# BotBuilder Uz

BotBuilder Uz is a multi-tenant MVP SaaS for small businesses in Uzbekistan to build and manage simple Telegram bots. Business owners can sign up, connect one Telegram bot, create button-based flows, publish the bot, collect leads and orders, send broadcasts, and track basic analytics from a clean admin dashboard.

## High-level architecture summary
- Frontend:
  Next.js 16 App Router, TypeScript, Tailwind CSS 4, React Hook Form, lightweight Recharts analytics.
- Backend:
  Next.js server components, server actions, and route handlers.
- Auth:
  Supabase Auth with email/password.
- Data:
  Supabase PostgreSQL with RLS and a reusable direct PostgreSQL connection module for scripts and diagnostics.
- Telegram:
  Telegram Bot API token verification, webhook activation, callback navigation, lead capture, order capture, and batching for broadcasts.

## Folder structure
```text
app/
  (auth)/
  api/bot/webhook/[botId]/
  auth/callback/
  dashboard/
components/
  auth/
  builder/
  charts/
  dashboard/
  forms/
  providers/
  ui/
docs/
  architecture.md
lib/
  db/
  security/
  supabase/
  telegram/
  utils/
  validations/
scripts/
  check-db.ts
  seed.ts
server/
  actions/
  repositories/
supabase/
  migrations/
types/
```

## Database schema SQL
- Main migration:
  `supabase/migrations/20260312132000_init_botbuilder_uz.sql`
- Core tables:
  `profiles`, `workspaces`, `workspace_members`, `bots`, `bot_connections`, `bot_flows`, `flow_nodes`, `flow_buttons`, `bot_users`, `leads`, `orders`, `broadcasts`, `broadcast_deliveries`, `interaction_logs`
- RLS:
  Scoped through `workspace_id` and `public.is_workspace_member(uuid)`

## Environment variables list
Copy `.env.example` to `.env.local` and fill the values:

```bash
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_HOST=
DATABASE_PORT=5432
DATABASE_NAME=umarxonsdb
DATABASE_USER=
DATABASE_PASSWORD=
DATABASE_URL=
TELEGRAM_WEBHOOK_BASE_URL=
TELEGRAM_ENCRYPTION_SECRET=
APP_ENCRYPTION_KEY=
DEMO_USER_EMAIL=
DEMO_USER_PASSWORD=
DEMO_WORKSPACE_NAME=Demo Workspace
DEMO_BOT_USERNAME=botbuilder_uz_demo_bot
DEMO_BOT_TOKEN=
```

## Connecting to umarxonsdb
- Required:
  Set `DATABASE_NAME=umarxonsdb`.
- The app does not hardcode database credentials.
- `lib/db/postgres.ts` is the reusable server-only Postgres module.
- `lib/db/postgres-core.ts` contains the pooled connection and parameterized query helper used by scripts.
- The direct PostgreSQL module is intended for:
  `db:check`, `db:seed`, future reporting jobs, and migration helpers.
- The main app runtime still uses the Supabase client for tenant-aware reads/writes and Auth integration.

Example connection shape:
```env
DATABASE_HOST=your-postgres-host
DATABASE_PORT=5432
DATABASE_NAME=umarxonsdb
DATABASE_USER=your-user
DATABASE_PASSWORD=your-password
DATABASE_URL=postgresql://your-user:your-password@your-postgres-host:5432/umarxonsdb
```

## Core backend implementation
- Auth server actions:
  `server/actions/auth.ts`
- Bot connection and webhook actions:
  `server/actions/bot.ts`
- Builder mutations:
  `server/actions/builder.ts`
- Broadcast delivery:
  `server/actions/broadcasts.ts`
- Order/settings mutations:
  `server/actions/orders.ts`, `server/actions/settings.ts`
- Webhook route:
  `app/api/bot/webhook/[botId]/route.ts`
- Flow engine:
  `lib/telegram/engine.ts`

## Frontend pages and components
- Landing page:
  `app/page.tsx`
- Auth routes:
  `/login`, `/signup`, `/forgot-password`, `/reset-password`
- Dashboard routes:
  `/dashboard`
  `/dashboard/bot`
  `/dashboard/builder`
  `/dashboard/leads`
  `/dashboard/orders`
  `/dashboard/broadcasts`
  `/dashboard/analytics`
  `/dashboard/settings`
- Shared layout:
  `app/dashboard/layout.tsx`, `components/dashboard/sidebar.tsx`, `components/dashboard/topbar.tsx`

## Webhook logic
- Bot token is stored encrypted in `bot_connections.encrypted_token`.
- Webhook activation generates a secret token and stores only its hash.
- Incoming updates are accepted only if the `x-telegram-bot-api-secret-token` hash matches.
- `/start` loads the published start node.
- Callback buttons navigate through published nodes.
- `lead_capture` and `order_form` nodes store progress in `bot_users.session_state`.
- Interaction logs are written for incoming, outgoing, and system events.

## Local run guide
1. Install dependencies:
   `npm install`
2. Copy env template:
   `copy .env.example .env.local`
3. Fill Supabase, database, and Telegram env values in `.env.local`.
4. Verify the Postgres connection points to `umarxonsdb`:
   `npm run db:check`
5. Run the SQL migration in your Supabase/PostgreSQL environment.
6. Optionally seed the demo account and sample data:
   `npm run db:seed`
7. Start the app:
   `npm run dev`
8. Open:
   `http://localhost:3000`

## Commands to execute
```bash
npm install
npm run db:check
npm run db:seed
npm run dev
npm run typecheck
npm run lint
npm run build
```

## Migration instructions for PostgreSQL
- Supabase SQL editor:
  Paste and run `supabase/migrations/20260312132000_init_botbuilder_uz.sql`
- `psql`:
  `psql "$DATABASE_URL" -f supabase/migrations/20260312132000_init_botbuilder_uz.sql`
- After migration, confirm RLS and indexes exist before opening the dashboard.

## Demo account instructions
- Set `DEMO_USER_EMAIL` and `DEMO_USER_PASSWORD` in `.env.local`.
- Run `npm run db:seed`.
- Sign in with that demo email/password at `/login`.

## What to test manually first
1. Sign up a new user and confirm the workspace is created.
2. Sign in and confirm `/dashboard` is protected.
3. Paste a real BotFather token and verify the bot metadata loads.
4. Activate the webhook and confirm Telegram points to `/api/bot/webhook/[botId]`.
5. In Builder, create a start menu node with buttons and publish the flow.
6. Send `/start` to the Telegram bot and confirm button navigation works.
7. Test a lead capture node and verify records appear in `/dashboard/leads`.
8. Test an order form node and verify records appear in `/dashboard/orders`.
9. Send a preview and broadcast from `/dashboard/broadcasts`.
10. Confirm analytics numbers and latest interactions update.

## Common failure points and fixes
- Missing env vars:
  If `npm run build` or runtime requests fail with Zod env errors, fill `.env.local` first.
- Wrong database target:
  Run `npm run db:check` and confirm it prints `umarxonsdb`.
- Supabase Auth works but dashboard tables fail:
  The migration or RLS policies likely were not applied.
- Telegram webhook returns 401:
  Re-activate the webhook so the secret header hash matches the stored value.
- Broadcasts fail:
  Confirm the bot token is valid and the bot has permission to message those users.
- Demo seed fails:
  Add `DEMO_USER_EMAIL` and `DEMO_USER_PASSWORD` to `.env.local`.

## Security considerations
- Telegram bot tokens are encrypted at rest.
- Database credentials and service-role keys stay server-side only.
- Secrets are never returned in API responses.
- Structured logs avoid printing tokens, passwords, or connection strings.
- RLS prevents users from reading other workspaces' data.

## Known limitations
- MVP supports one workspace per user.
- MVP supports one Telegram bot per workspace.
- Builder is structured form/tree editing, not drag-and-drop.
- Broadcast sending is synchronous and best suited for smaller audiences.
- Analytics are simple runtime aggregations rather than precomputed reports.

## Next iteration suggestions
- Add background jobs for broadcasts and webhook retries.
- Support versioned draft/published flows.
- Add multiple workspace members and roles.
- Add media messages, tags, templates, and richer order pipelines.
- Add import/export for flows and bot cloning.

## Architecture notes
- See `docs/architecture.md` for the tenant model, runtime split, Telegram execution design, and extension path.
