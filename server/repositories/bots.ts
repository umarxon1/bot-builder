import "server-only";

import { randomBytes } from "crypto";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { decryptText, encryptText, hashText } from "@/lib/security/encryption";
import { getServerEnv } from "@/lib/env.server";
import { setTelegramWebhook, verifyTelegramBotToken } from "@/lib/telegram/client";
import { ensureDraftFlow } from "@/server/repositories/builder";
import type { BotConnectionRow, BotRow } from "@/types/app";

export type BotConnectionSummary = (BotRow & {
  connection: BotConnectionRow | null;
}) | null;

export async function getBotConnectionSummary(
  workspaceId: string,
): Promise<BotConnectionSummary> {
  const supabase = await createServerSupabaseClient();
  const [{ data: botData }, { data: connectionData }] = await Promise.all([
    supabase
      .from("bots")
      .select("*")
      .eq("workspace_id", workspaceId)
      .maybeSingle(),
    supabase
      .from("bot_connections")
      .select("*")
      .eq("workspace_id", workspaceId)
      .maybeSingle(),
  ]);

  const bot = botData as BotRow | null;
  const connection = connectionData as BotConnectionRow | null;

  if (!bot) {
    return null;
  }

  return {
    ...bot,
    connection,
  };
}

export async function verifyAndStoreBotToken(input: {
  workspaceId: string;
  token: string;
}) {
  const admin = createAdminSupabaseClient();
  const botMeta = await verifyTelegramBotToken(input.token);
  const { data: existingBotData } = await admin
    .from("bots")
    .select("*")
    .eq("workspace_id", input.workspaceId)
    .maybeSingle();
  const existingBot = existingBotData as BotRow | null;

  const botPayload = {
    workspace_id: input.workspaceId,
    name: botMeta.first_name,
    telegram_bot_id: String(botMeta.id),
    telegram_username: botMeta.username ?? null,
    telegram_first_name: botMeta.first_name,
    status: "connected" as const,
    verified_at: new Date().toISOString(),
  };

  const botData =
    existingBot?.id
      ? (
          await admin
            .from("bots")
            .update(botPayload)
            .eq("id", existingBot.id)
            .select("*")
            .single()
        ).data
      : (
          await admin
            .from("bots")
            .insert(botPayload)
            .select("*")
            .single()
        ).data;

  const bot = botData as BotRow | null;

  if (!bot) {
    throw new Error("Bot saqlanmadi");
  }

  const connectionPayload = {
    workspace_id: input.workspaceId,
    bot_id: bot.id,
    encrypted_token: encryptText(input.token),
    token_last_four: input.token.slice(-4),
    status: "verified" as const,
    last_error: null,
  };

  const { error: connectionError } = existingBot?.id
    ? await admin
        .from("bot_connections")
        .upsert(connectionPayload, { onConflict: "bot_id" })
    : await admin
        .from("bot_connections")
        .insert(connectionPayload);

  if (connectionError) {
    throw new Error(connectionError.message);
  }

  await ensureDraftFlow(input.workspaceId, bot.id, botMeta.first_name);

  return {
    bot,
    botMeta,
  };
}

export async function activateBotWebhook(input: {
  workspaceId: string;
  botId: string;
}) {
  const admin = createAdminSupabaseClient();
  const env = getServerEnv();

  const { data: connectionData } = await admin
    .from("bot_connections")
    .select("*")
    .eq("workspace_id", input.workspaceId)
    .eq("bot_id", input.botId)
    .single();
  const connection = connectionData as BotConnectionRow | null;

  if (!connection) {
    throw new Error("Avval bot tokenini tasdiqlang");
  }

  const token = decryptText(connection.encrypted_token);
  const secretToken = randomBytes(24).toString("hex");
  const webhookUrl = `${env.TELEGRAM_WEBHOOK_BASE_URL}/api/bot/webhook/${input.botId}`;

  await setTelegramWebhook({
    token,
    url: webhookUrl,
    secretToken,
  });

  const updates = await Promise.all([
    admin
      .from("bot_connections")
      .update({
        webhook_secret_hash: hashText(secretToken),
        webhook_url: webhookUrl,
        status: "webhook_live",
        last_error: null,
        last_webhook_at: new Date().toISOString(),
      })
      .eq("bot_id", input.botId)
      .eq("workspace_id", input.workspaceId),
    admin
      .from("bots")
      .update({ status: "webhook_live" })
      .eq("id", input.botId)
      .eq("workspace_id", input.workspaceId),
  ]);

  const failed = updates.find((result) => result.error);

  if (failed?.error) {
    throw new Error(failed.error.message);
  }
}

export async function getBotTokenForWebhook(botId: string) {
  const admin = createAdminSupabaseClient();
  const [{ data: botData }, { data: connectionData }] = await Promise.all([
    admin.from("bots").select("*").eq("id", botId).single(),
    admin.from("bot_connections").select("*").eq("bot_id", botId).single(),
  ]);
  const bot = botData as BotRow | null;
  const connection = connectionData as BotConnectionRow | null;

  if (!bot || !connection) {
    throw new Error("Bot connection topilmadi");
  }

  return {
    bot,
    connection,
    token: decryptText(connection.encrypted_token),
  };
}
