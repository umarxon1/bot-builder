import "server-only";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import {
  parseNodeConfig,
  type BotSessionState,
  type BotUserRow,
  type FlowButtonRow,
  type FlowNodeRow,
  type FlowNodeWithButtons,
} from "@/types/app";
import { normalizePhone } from "@/lib/utils/format";
import type { TelegramMessage, TelegramUser } from "@/types/telegram";
import type { Json } from "@/types/database";

type PublishedFlowBot = {
  id: string;
  workspace_id: string;
  published_flow_id: string | null;
};

type NodeWithButtons = FlowNodeRow & {
  buttons: FlowButtonRow[];
};

export async function getPublishedFlowTree(botId: string) {
  const admin = createAdminSupabaseClient();
  const { data: botData } = await admin
    .from("bots")
    .select("id, workspace_id, published_flow_id")
    .eq("id", botId)
    .single();
  const bot = botData as PublishedFlowBot | null;

  if (!bot?.published_flow_id) {
    throw new Error("Published flow topilmadi");
  }

  const { data: nodesData } = await admin
    .from("flow_nodes")
    .select("*, buttons:flow_buttons(*)")
    .eq("flow_id", bot.published_flow_id)
    .eq("workspace_id", bot.workspace_id)
    .order("order_index", { ascending: true });
  const nodes = (nodesData ?? []) as unknown as NodeWithButtons[];

  const parsedNodes =
    nodes.map((node) => ({
      ...node,
      parsedConfig: parseNodeConfig(node.config),
      buttons: node.buttons ?? [],
    })) ?? [];

  return {
    workspaceId: bot.workspace_id,
    flowId: bot.published_flow_id,
    nodes: parsedNodes as FlowNodeWithButtons[],
    startNode:
      (parsedNodes.find((node) => node.is_start) as FlowNodeWithButtons | undefined) ?? null,
  };
}

export async function upsertBotUserFromTelegram(input: {
  workspaceId: string;
  botId: string;
  chatId: string;
  telegramUser: TelegramUser;
  phone?: string | null;
}) {
  const admin = createAdminSupabaseClient();
  const { data: botUserData, error } = await admin
    .from("bot_users")
    .upsert(
      {
        workspace_id: input.workspaceId,
        bot_id: input.botId,
        telegram_user_id: String(input.telegramUser.id),
        chat_id: input.chatId,
        username: input.telegramUser.username ?? null,
        first_name: input.telegramUser.first_name ?? null,
        last_name: input.telegramUser.last_name ?? null,
        phone: input.phone ?? null,
        last_interacted_at: new Date().toISOString(),
      },
      {
        onConflict: "bot_id,telegram_user_id",
      },
    )
    .select("*")
    .single();
  const data = botUserData as BotUserRow | null;

  if (error || !data) {
    throw new Error(error?.message ?? "Bot user saqlanmadi");
  }

  return data;
}

export async function updateBotUserRuntimeState(input: {
  botUserId: string;
  currentNodeId?: string | null;
  sessionState?: BotSessionState | null;
  phone?: string | null;
}) {
  const admin = createAdminSupabaseClient();
  const { error } = await admin
    .from("bot_users")
    .update({
      current_node_id: input.currentNodeId ?? null,
      session_state: input.sessionState ?? null,
      phone: input.phone ?? undefined,
      last_interacted_at: new Date().toISOString(),
    })
    .eq("id", input.botUserId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function logInteraction(input: {
  workspaceId: string;
  botId: string;
  botUserId?: string | null;
  flowNodeId?: string | null;
  direction: "incoming" | "outgoing" | "system";
  eventType:
    | "start"
    | "message"
    | "callback"
    | "lead_captured"
    | "order_captured"
    | "broadcast"
    | "error"
    | "flow_publish";
  messageText?: string | null;
  metadata?: Record<string, unknown> | null;
}) {
  const admin = createAdminSupabaseClient();
  await admin.from("interaction_logs").insert({
    workspace_id: input.workspaceId,
    bot_id: input.botId,
    bot_user_id: input.botUserId ?? null,
    flow_node_id: input.flowNodeId ?? null,
    direction: input.direction,
    event_type: input.eventType,
    message_text: input.messageText ?? null,
    metadata: (input.metadata ?? null) as Json,
  });
}

export async function createLeadRecord(input: {
  workspaceId: string;
  botId: string;
  botUserId: string;
  flowNodeId: string;
  fullName: string;
  phone: string;
}) {
  const admin = createAdminSupabaseClient();
  const normalizedPhone = normalizePhone(input.phone);

  const { error } = await admin.from("leads").insert({
    workspace_id: input.workspaceId,
    bot_id: input.botId,
    bot_user_id: input.botUserId,
    flow_node_id: input.flowNodeId,
    full_name: input.fullName,
    phone: normalizedPhone,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function createOrderRecord(input: {
  workspaceId: string;
  botId: string;
  botUserId: string;
  flowNodeId: string;
  productName: string;
  customerName: string;
  phone: string;
  note?: string | null;
}) {
  const admin = createAdminSupabaseClient();
  const { error } = await admin.from("orders").insert({
    workspace_id: input.workspaceId,
    bot_id: input.botId,
    bot_user_id: input.botUserId,
    flow_node_id: input.flowNodeId,
    product_name: input.productName,
    customer_name: input.customerName,
    phone: normalizePhone(input.phone),
    note: input.note ?? null,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export function parseSessionState(value: unknown): BotSessionState {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as BotSessionState;
}

export function extractMessageText(message: TelegramMessage) {
  return message.text?.trim() ?? null;
}

export function extractPhoneNumber(message: TelegramMessage) {
  if (message.contact?.phone_number) {
    return normalizePhone(message.contact.phone_number);
  }

  if (message.text) {
    return normalizePhone(message.text);
  }

  return null;
}
