import { randomBytes } from "crypto";

import { createClient } from "@supabase/supabase-js";

import { query } from "../lib/db/postgres-core";
import { getServerEnv } from "../lib/env.server";
import { encryptText } from "../lib/security/encryption-core";
import { slugify } from "../lib/utils/slug";
import type { Database } from "../types/database";

function requireDemoEnv(name: "DEMO_USER_EMAIL" | "DEMO_USER_PASSWORD") {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required to seed the demo account.`);
  }

  return value;
}

async function getOrCreateDemoUser() {
  const env = getServerEnv();
  const demoEmail = requireDemoEnv("DEMO_USER_EMAIL");
  const demoPassword = requireDemoEnv("DEMO_USER_PASSWORD");

  const admin = createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );

  const existingUsers = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });

  const existingUser = existingUsers.data.users.find((user) => user.email === demoEmail);

  if (existingUser) {
    return existingUser;
  }

  const { data, error } = await admin.auth.admin.createUser({
    email: demoEmail,
    password: demoPassword,
    email_confirm: true,
    user_metadata: {
      full_name: "Demo Owner",
    },
  });

  if (error || !data.user) {
    throw new Error(error?.message ?? "Demo auth user could not be created.");
  }

  return data.user;
}

async function main() {
  const demoWorkspaceName = process.env.DEMO_WORKSPACE_NAME || "Demo Workspace";
  const demoBotUsername = process.env.DEMO_BOT_USERNAME || "botbuilder_uz_demo_bot";
  const demoBotToken =
    process.env.DEMO_BOT_TOKEN ||
    `${Math.floor(Math.random() * 1_000_000_000)}:${randomBytes(24).toString("hex")}`;
  const now = new Date().toISOString();
  const demoUser = await getOrCreateDemoUser();
  const workspaceSlug = slugify(demoWorkspaceName) || "demo-workspace";

  const workspaceResult = await query<{ id: string }>(
    `
      insert into public.workspaces (name, slug, owner_user_id)
      values ($1, $2, $3)
      on conflict (slug)
      do update set name = excluded.name, owner_user_id = excluded.owner_user_id
      returning id
    `,
    [demoWorkspaceName, workspaceSlug, demoUser.id],
  );
  const workspaceId = workspaceResult.rows[0]?.id;

  if (!workspaceId) {
    throw new Error("Workspace could not be created.");
  }

  await query(
    `
      insert into public.profiles (id, email, full_name, default_workspace_id)
      values ($1, $2, $3, $4)
      on conflict (id)
      do update set
        email = excluded.email,
        full_name = excluded.full_name,
        default_workspace_id = excluded.default_workspace_id
    `,
    [demoUser.id, demoUser.email ?? requireDemoEnv("DEMO_USER_EMAIL"), "Demo Owner", workspaceId],
  );

  await query(
    `
      insert into public.workspace_members (workspace_id, user_id, role)
      values ($1, $2, 'owner')
      on conflict (workspace_id, user_id) do nothing
    `,
    [workspaceId, demoUser.id],
  );

  const botResult = await query<{ id: string }>(
    `
      insert into public.bots (
        workspace_id,
        name,
        telegram_bot_id,
        telegram_username,
        telegram_first_name,
        status,
        verified_at
      )
      values ($1, $2, $3, $4, $5, 'connected', $6)
      on conflict (workspace_id)
      do update set
        name = excluded.name,
        telegram_username = excluded.telegram_username,
        telegram_first_name = excluded.telegram_first_name,
        status = excluded.status,
        verified_at = excluded.verified_at
      returning id
    `,
    [
      workspaceId,
      "Demo Sales Bot",
      String(700000000 + Math.floor(Math.random() * 99999)),
      demoBotUsername,
      "Demo Sales Bot",
      now,
    ],
  );
  const botId = botResult.rows[0]?.id;

  if (!botId) {
    throw new Error("Bot record could not be created.");
  }

  await query(
    `
      insert into public.bot_connections (
        workspace_id,
        bot_id,
        encrypted_token,
        token_last_four,
        status
      )
      values ($1, $2, $3, $4, 'verified')
      on conflict (bot_id)
      do update set
        encrypted_token = excluded.encrypted_token,
        token_last_four = excluded.token_last_four,
        status = excluded.status
    `,
    [workspaceId, botId, encryptText(demoBotToken), demoBotToken.slice(-4)],
  );

  const flowResult = await query<{ id: string }>(
    `
      insert into public.bot_flows (workspace_id, bot_id, name, version, is_published, published_at)
      values ($1, $2, 'Demo Flow', 1, true, $3)
      on conflict do nothing
      returning id
    `,
    [workspaceId, botId, now],
  );

  let flowId = flowResult.rows[0]?.id;

  if (!flowId) {
    const existingFlow = await query<{ id: string }>(
      `select id from public.bot_flows where workspace_id = $1 and bot_id = $2 limit 1`,
      [workspaceId, botId],
    );
    flowId = existingFlow.rows[0]?.id;
  }

  if (!flowId) {
    throw new Error("Flow could not be created.");
  }

  const nodeCount = await query<{ count: string }>(
    `select count(*) from public.flow_nodes where flow_id = $1`,
    [flowId],
  );

  if (Number(nodeCount.rows[0]?.count ?? 0) === 0) {
    const startNode = await query<{ id: string }>(
      `
        insert into public.flow_nodes (workspace_id, flow_id, key, title, type, content, is_start, order_index)
        values ($1, $2, 'start', 'Start', 'menu', $3, true, 0)
        returning id
      `,
      [
        workspaceId,
        flowId,
        "Assalomu alaykum! Demo botga xush kelibsiz. Quyidagi bo'limdan tanlang.",
      ],
    );

    const leadNode = await query<{ id: string }>(
      `
        insert into public.flow_nodes (workspace_id, flow_id, key, title, type, content, config, order_index)
        values ($1, $2, 'lead_capture', 'Lead Capture', 'lead_capture', $3, $4::jsonb, 1)
        returning id
      `,
      [
        workspaceId,
        flowId,
        "Ismingizni yuboring, keyin telefon raqamingizni olamiz.",
        JSON.stringify({
          successMessage: "Rahmat! Operator siz bilan bog'lanadi.",
        }),
      ],
    );

    const orderNode = await query<{ id: string }>(
      `
        insert into public.flow_nodes (workspace_id, flow_id, key, title, type, content, config, order_index)
        values ($1, $2, 'order_form', 'Order Form', 'order_form', $3, $4::jsonb, 2)
        returning id
      `,
      [
        workspaceId,
        flowId,
        "Buyurtma uchun ism, telefon va izoh qoldiring.",
        JSON.stringify({
          productName: "Demo Service",
          successMessage: "Buyurtma qabul qilindi.",
        }),
      ],
    );

    const catalogNode = await query<{ id: string }>(
      `
        insert into public.flow_nodes (workspace_id, flow_id, key, title, type, content, config, order_index)
        values ($1, $2, 'catalog', 'Catalog', 'external_link', $3, $4::jsonb, 3)
        returning id
      `,
      [
        workspaceId,
        flowId,
        "Katalog sahifasini quyidagi button orqali oching.",
        JSON.stringify({
          url: "https://example.com/catalog",
          buttonLabel: "Katalogni ochish",
        }),
      ],
    );

    const startNodeId = startNode.rows[0]?.id;
    const leadNodeId = leadNode.rows[0]?.id;
    const orderNodeId = orderNode.rows[0]?.id;
    const catalogNodeId = catalogNode.rows[0]?.id;

    if (!startNodeId || !leadNodeId || !orderNodeId || !catalogNodeId) {
      throw new Error("Demo flow nodes could not be created.");
    }

    await query(
      `
        insert into public.flow_buttons (workspace_id, node_id, label, kind, target_node_id, order_index)
        values
          ($1, $2, 'Lead qoldirish', 'navigate', $3, 0),
          ($1, $2, 'Buyurtma berish', 'navigate', $4, 1),
          ($1, $2, 'Katalog', 'navigate', $5, 2)
      `,
      [workspaceId, startNodeId, leadNodeId, orderNodeId, catalogNodeId],
    );
  }

  await query(
    `
      update public.bot_flows
      set is_published = true, published_at = $2
      where id = $1
    `,
    [flowId, now],
  );

  await query(
    `
      update public.bots
      set published_flow_id = $2
      where id = $1
    `,
    [botId, flowId],
  );

  const botUserCount = await query<{ count: string }>(
    `select count(*) from public.bot_users where workspace_id = $1 and bot_id = $2`,
    [workspaceId, botId],
  );

  if (Number(botUserCount.rows[0]?.count ?? 0) === 0) {
    await query(
      `
        insert into public.bot_users (
          workspace_id,
          bot_id,
          telegram_user_id,
          chat_id,
          username,
          first_name,
          last_name,
          last_interacted_at
        )
        values
          ($1, $2, 101001, 101001, 'aziza_demo', 'Aziza', 'Karimova', $3),
          ($1, $2, 101002, 101002, 'sardor_demo', 'Sardor', 'Aliyev', $3),
          ($1, $2, 101003, 101003, 'nargiza_demo', 'Nargiza', 'Tursunova', $3)
      `,
      [workspaceId, botId, now],
    );
  }

  const leadExists = await query<{ count: string }>(
    `select count(*) from public.leads where workspace_id = $1`,
    [workspaceId],
  );

  if (Number(leadExists.rows[0]?.count ?? 0) === 0) {
    await query(
      `
        insert into public.leads (workspace_id, bot_id, full_name, phone)
        values
          ($1, $2, 'Aziza Karimova', '+998901112233'),
          ($1, $2, 'Sardor Aliyev', '+998907776655')
      `,
      [workspaceId, botId],
    );
  }

  const orderExists = await query<{ count: string }>(
    `select count(*) from public.orders where workspace_id = $1`,
    [workspaceId],
  );

  if (Number(orderExists.rows[0]?.count ?? 0) === 0) {
    await query(
      `
        insert into public.orders (
          workspace_id,
          bot_id,
          product_name,
          customer_name,
          phone,
          note,
          status
        )
        values
          ($1, $2, 'Demo Service', 'Nargiza Tursunova', '+998909998877', 'Tezroq aloqa kerak', 'new'),
          ($1, $2, 'Consulting Package', 'Aziza Karimova', '+998901112233', 'Telegram orqali bog''laning', 'contacted')
      `,
      [workspaceId, botId],
    );
  }

  const interactionExists = await query<{ count: string }>(
    `select count(*) from public.interaction_logs where workspace_id = $1`,
    [workspaceId],
  );

  if (Number(interactionExists.rows[0]?.count ?? 0) === 0) {
    await query(
      `
        insert into public.interaction_logs (
          workspace_id,
          bot_id,
          direction,
          event_type,
          message_text,
          created_at
        )
        values
          ($1, $2, 'incoming', 'start', '/start', now() - interval '6 days'),
          ($1, $2, 'outgoing', 'message', 'Assalomu alaykum!', now() - interval '6 days'),
          ($1, $2, 'incoming', 'message', 'Lead qoldirish', now() - interval '4 days'),
          ($1, $2, 'system', 'lead_captured', 'Aziza Karimova', now() - interval '3 days'),
          ($1, $2, 'system', 'order_captured', 'Demo Service', now() - interval '1 day')
      `,
      [workspaceId, botId],
    );
  }

  console.log(`Seed completed for workspace "${demoWorkspaceName}" and user "${demoUser.email}".`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Seed failed");
  process.exit(1);
});
