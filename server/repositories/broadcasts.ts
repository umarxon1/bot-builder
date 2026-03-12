import "server-only";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { BotUserRow, BroadcastRow } from "@/types/app";

export async function getBroadcastAudience(workspaceId: string, botId: string) {
  const supabase = await createServerSupabaseClient();
  const { data, count } = await supabase
    .from("bot_users")
    .select("id, chat_id, first_name, username", { count: "exact" })
    .eq("workspace_id", workspaceId)
    .eq("bot_id", botId)
    .order("last_interacted_at", { ascending: false });

  return {
    count: count ?? 0,
    recipients: (data ?? []) as Array<
      Pick<BotUserRow, "id" | "chat_id" | "first_name" | "username">
    >,
  };
}

export async function getBroadcastHistory(workspaceId: string): Promise<BroadcastRow[]> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("broadcasts")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  return (data ?? []) as BroadcastRow[];
}

export async function createBroadcastRecord(input: {
  workspaceId: string;
  botId: string;
  createdByUserId: string;
  title: string;
  message: string;
  previewRecipientCount: number;
}) {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("broadcasts")
    .insert({
      workspace_id: input.workspaceId,
      bot_id: input.botId,
      created_by_user_id: input.createdByUserId,
      title: input.title,
      message: input.message,
      preview_recipient_count: input.previewRecipientCount,
      status: "sending",
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Broadcast saqlanmadi");
  }

  return data as BroadcastRow;
}

export async function markBroadcastCompleted(input: {
  broadcastId: string;
  sentCount: number;
  failedCount: number;
  status: "sent" | "failed";
}) {
  const admin = createAdminSupabaseClient();
  const { error } = await admin
    .from("broadcasts")
    .update({
      sent_count: input.sentCount,
      failed_count: input.failedCount,
      sent_at: new Date().toISOString(),
      status: input.status,
    })
    .eq("id", input.broadcastId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function insertBroadcastDelivery(input: {
  workspaceId: string;
  broadcastId: string;
  botUserId: string;
  telegramChatId: string;
  status: "sent" | "failed";
  errorMessage?: string | null;
}) {
  const admin = createAdminSupabaseClient();
  const { error } = await admin.from("broadcast_deliveries").insert({
    workspace_id: input.workspaceId,
    broadcast_id: input.broadcastId,
    bot_user_id: input.botUserId,
    telegram_chat_id: input.telegramChatId,
    status: input.status,
    error_message: input.errorMessage ?? null,
    attempted_at: new Date().toISOString(),
  });

  if (error) {
    throw new Error(error.message);
  }
}
