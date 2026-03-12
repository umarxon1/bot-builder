create extension if not exists "pgcrypto";

create type public.member_role as enum ('owner', 'member');
create type public.bot_status as enum ('draft', 'connected', 'webhook_live', 'paused');
create type public.connection_status as enum ('pending', 'verified', 'webhook_live', 'error');
create type public.flow_node_type as enum (
  'message',
  'menu',
  'lead_capture',
  'order_form',
  'external_link'
);
create type public.flow_button_kind as enum ('navigate', 'url');
create type public.order_status as enum ('new', 'contacted', 'completed', 'cancelled');
create type public.broadcast_status as enum ('draft', 'previewed', 'sending', 'sent', 'failed');
create type public.delivery_status as enum ('pending', 'sent', 'failed');
create type public.interaction_direction as enum ('incoming', 'outgoing', 'system');
create type public.interaction_event_type as enum (
  'start',
  'message',
  'callback',
  'lead_captured',
  'order_captured',
  'broadcast',
  'error',
  'flow_publish'
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.is_workspace_member(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_members
    where workspace_id = target_workspace_id
      and user_id = auth.uid()
  );
$$;

grant execute on function public.is_workspace_member(uuid) to authenticated;

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  default_workspace_id uuid references public.workspaces(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.member_role not null default 'member',
  created_at timestamptz not null default timezone('utc', now()),
  unique (workspace_id, user_id)
);

create table public.bots (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null unique references public.workspaces(id) on delete cascade,
  name text not null,
  telegram_bot_id bigint not null unique,
  telegram_username text,
  telegram_first_name text,
  status public.bot_status not null default 'draft',
  published_flow_id uuid,
  verified_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.bot_connections (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  bot_id uuid not null unique references public.bots(id) on delete cascade,
  encrypted_token text not null,
  token_last_four text not null,
  webhook_secret_hash text,
  webhook_url text,
  status public.connection_status not null default 'pending',
  last_webhook_at timestamptz,
  last_error text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.bot_flows (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  bot_id uuid not null references public.bots(id) on delete cascade,
  name text not null,
  version integer not null default 1,
  is_published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.bots
  add constraint bots_published_flow_id_fkey
  foreign key (published_flow_id)
  references public.bot_flows(id)
  on delete set null;

create table public.flow_nodes (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  flow_id uuid not null references public.bot_flows(id) on delete cascade,
  key text not null,
  title text not null,
  type public.flow_node_type not null,
  content text not null,
  config jsonb not null default '{}'::jsonb,
  is_start boolean not null default false,
  order_index integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.flow_buttons (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  node_id uuid not null references public.flow_nodes(id) on delete cascade,
  label text not null,
  kind public.flow_button_kind not null default 'navigate',
  target_node_id uuid references public.flow_nodes(id) on delete set null,
  url text,
  order_index integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.bot_users (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  bot_id uuid not null references public.bots(id) on delete cascade,
  telegram_user_id bigint not null,
  chat_id bigint not null,
  username text,
  first_name text,
  last_name text,
  phone text,
  current_node_id uuid references public.flow_nodes(id) on delete set null,
  session_state jsonb,
  started_at timestamptz not null default timezone('utc', now()),
  last_interacted_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (bot_id, telegram_user_id),
  unique (bot_id, chat_id)
);

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  bot_id uuid not null references public.bots(id) on delete cascade,
  bot_user_id uuid references public.bot_users(id) on delete set null,
  flow_node_id uuid references public.flow_nodes(id) on delete set null,
  full_name text not null,
  phone text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  bot_id uuid not null references public.bots(id) on delete cascade,
  bot_user_id uuid references public.bot_users(id) on delete set null,
  flow_node_id uuid references public.flow_nodes(id) on delete set null,
  product_name text not null,
  customer_name text not null,
  phone text not null,
  note text,
  status public.order_status not null default 'new',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.broadcasts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  bot_id uuid not null references public.bots(id) on delete cascade,
  created_by_user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  message text not null,
  preview_recipient_count integer not null default 0,
  sent_count integer not null default 0,
  failed_count integer not null default 0,
  status public.broadcast_status not null default 'draft',
  sent_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.broadcast_deliveries (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  broadcast_id uuid not null references public.broadcasts(id) on delete cascade,
  bot_user_id uuid not null references public.bot_users(id) on delete cascade,
  telegram_chat_id bigint not null,
  status public.delivery_status not null default 'pending',
  error_message text,
  attempted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  unique (broadcast_id, bot_user_id)
);

create table public.interaction_logs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  bot_id uuid not null references public.bots(id) on delete cascade,
  bot_user_id uuid references public.bot_users(id) on delete set null,
  flow_node_id uuid references public.flow_nodes(id) on delete set null,
  direction public.interaction_direction not null,
  event_type public.interaction_event_type not null,
  message_text text,
  metadata jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create unique index flow_nodes_start_per_flow_idx
  on public.flow_nodes (flow_id)
  where is_start = true;

create unique index flow_nodes_key_per_flow_idx
  on public.flow_nodes (flow_id, key);

create index workspace_members_user_id_idx on public.workspace_members (user_id);
create index bots_workspace_id_idx on public.bots (workspace_id);
create index bot_flows_workspace_id_idx on public.bot_flows (workspace_id);
create index bot_flows_bot_id_idx on public.bot_flows (bot_id);
create index flow_nodes_workspace_id_idx on public.flow_nodes (workspace_id);
create index flow_buttons_node_id_idx on public.flow_buttons (node_id);
create index bot_users_workspace_id_idx on public.bot_users (workspace_id);
create index bot_users_last_interacted_at_idx on public.bot_users (last_interacted_at desc);
create index leads_workspace_id_idx on public.leads (workspace_id, created_at desc);
create index leads_phone_idx on public.leads (phone);
create index orders_workspace_id_idx on public.orders (workspace_id, created_at desc);
create index orders_status_idx on public.orders (status);
create index broadcasts_workspace_id_idx on public.broadcasts (workspace_id, created_at desc);
create index broadcast_deliveries_broadcast_id_idx on public.broadcast_deliveries (broadcast_id);
create index interaction_logs_workspace_id_idx on public.interaction_logs (workspace_id, created_at desc);
create index interaction_logs_event_type_idx on public.interaction_logs (event_type);

create trigger set_workspaces_updated_at
before update on public.workspaces
for each row
execute function public.set_updated_at();

create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

create trigger set_bots_updated_at
before update on public.bots
for each row
execute function public.set_updated_at();

create trigger set_bot_connections_updated_at
before update on public.bot_connections
for each row
execute function public.set_updated_at();

create trigger set_bot_flows_updated_at
before update on public.bot_flows
for each row
execute function public.set_updated_at();

create trigger set_flow_nodes_updated_at
before update on public.flow_nodes
for each row
execute function public.set_updated_at();

create trigger set_flow_buttons_updated_at
before update on public.flow_buttons
for each row
execute function public.set_updated_at();

create trigger set_bot_users_updated_at
before update on public.bot_users
for each row
execute function public.set_updated_at();

create trigger set_leads_updated_at
before update on public.leads
for each row
execute function public.set_updated_at();

create trigger set_orders_updated_at
before update on public.orders
for each row
execute function public.set_updated_at();

create trigger set_broadcasts_updated_at
before update on public.broadcasts
for each row
execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.bots enable row level security;
alter table public.bot_connections enable row level security;
alter table public.bot_flows enable row level security;
alter table public.flow_nodes enable row level security;
alter table public.flow_buttons enable row level security;
alter table public.bot_users enable row level security;
alter table public.leads enable row level security;
alter table public.orders enable row level security;
alter table public.broadcasts enable row level security;
alter table public.broadcast_deliveries enable row level security;
alter table public.interaction_logs enable row level security;

create policy "Profiles are viewable by owner"
on public.profiles
for select
to authenticated
using (id = auth.uid());

create policy "Profiles are insertable by owner"
on public.profiles
for insert
to authenticated
with check (id = auth.uid());

create policy "Profiles are updatable by owner"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy "Workspaces are viewable by members"
on public.workspaces
for select
to authenticated
using (public.is_workspace_member(id));

create policy "Workspaces are insertable by owner"
on public.workspaces
for insert
to authenticated
with check (owner_user_id = auth.uid());

create policy "Workspaces are updatable by owner"
on public.workspaces
for update
to authenticated
using (owner_user_id = auth.uid())
with check (owner_user_id = auth.uid());

create policy "Workspace members are viewable by workspace members"
on public.workspace_members
for select
to authenticated
using (public.is_workspace_member(workspace_id));

create policy "Workspace members are insertable by owner"
on public.workspace_members
for insert
to authenticated
with check (auth.uid() = user_id or public.is_workspace_member(workspace_id));

create policy "Workspace members are removable by owner"
on public.workspace_members
for delete
to authenticated
using (public.is_workspace_member(workspace_id));

create policy "Bots are accessible by workspace members"
on public.bots
for all
to authenticated
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));

create policy "Bot connections are accessible by workspace members"
on public.bot_connections
for all
to authenticated
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));

create policy "Bot flows are accessible by workspace members"
on public.bot_flows
for all
to authenticated
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));

create policy "Flow nodes are accessible by workspace members"
on public.flow_nodes
for all
to authenticated
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));

create policy "Flow buttons are accessible by workspace members"
on public.flow_buttons
for all
to authenticated
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));

create policy "Bot users are accessible by workspace members"
on public.bot_users
for all
to authenticated
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));

create policy "Leads are accessible by workspace members"
on public.leads
for all
to authenticated
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));

create policy "Orders are accessible by workspace members"
on public.orders
for all
to authenticated
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));

create policy "Broadcasts are accessible by workspace members"
on public.broadcasts
for all
to authenticated
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));

create policy "Broadcast deliveries are accessible by workspace members"
on public.broadcast_deliveries
for all
to authenticated
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));

create policy "Interaction logs are accessible by workspace members"
on public.interaction_logs
for all
to authenticated
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));
