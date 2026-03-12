import "server-only";

import { subDays } from "date-fns";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  parseNodeConfig,
  type ActivityPoint,
  type FlowButtonRow,
  type FlowNodeRow,
  type InteractionPreview,
  type LeadRow,
  type OrderRow,
} from "@/types/app";

type InteractionRecord = {
  id: string;
  event_type: InteractionPreview["eventType"];
  direction: InteractionPreview["direction"];
  message_text: string | null;
  created_at: string;
  bot_user?: {
    first_name?: string | null;
    last_name?: string | null;
    username?: string | null;
  } | null;
};

type NodePreviewRecord = FlowNodeRow & {
  buttons: FlowButtonRow[];
};

function formatActivityDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export async function getDashboardOverview(workspaceId: string) {
  const supabase = await createServerSupabaseClient();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [botUsers, leads, orders, messagesToday, interactions, latestLeads, latestOrders] =
    await Promise.all([
      supabase
        .from("bot_users")
        .select("id", { count: "exact", head: true })
        .eq("workspace_id", workspaceId),
      supabase
        .from("leads")
        .select("id", { count: "exact", head: true })
        .eq("workspace_id", workspaceId),
      supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("workspace_id", workspaceId),
      supabase
        .from("interaction_logs")
        .select("id", { count: "exact", head: true })
        .eq("workspace_id", workspaceId)
        .gte("created_at", todayStart.toISOString()),
      supabase
        .from("interaction_logs")
        .select("id, event_type, direction, message_text, created_at, bot_user:bot_users(first_name, last_name, username)")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false })
        .limit(8),
      supabase
        .from("leads")
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("orders")
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

  const activityStart = subDays(new Date(), 6);
  const { data: activityLogs } = await supabase
    .from("interaction_logs")
    .select("created_at")
    .eq("workspace_id", workspaceId)
    .gte("created_at", activityStart.toISOString());

  const bucket = new Map<string, number>();

  Array.from({ length: 7 }).forEach((_, index) => {
    const date = subDays(new Date(), 6 - index);
    bucket.set(formatActivityDate(date), 0);
  });

  ((activityLogs ?? []) as Array<{ created_at: string }>).forEach((item) => {
    const key = formatActivityDate(new Date(item.created_at));
    bucket.set(key, (bucket.get(key) ?? 0) + 1);
  });

  const activity: ActivityPoint[] = Array.from(bucket.entries()).map(([date, count]) => ({
    date,
    count,
  }));

  const latestInteractions: InteractionPreview[] = (
    (interactions.data ?? []) as unknown as InteractionRecord[]
  ).map((item) => {
      const botUser = Array.isArray(item.bot_user) ? item.bot_user[0] : item.bot_user;
      const displayName =
        [botUser?.first_name, botUser?.last_name].filter(Boolean).join(" ") ||
        botUser?.username ||
        null;

      return {
        id: item.id,
        eventType: item.event_type,
        direction: item.direction,
        messageText: item.message_text,
        createdAt: item.created_at,
        botUserName: displayName,
      };
    });

  return {
    stats: {
      totalBotUsers: botUsers.count ?? 0,
      leadsCount: leads.count ?? 0,
      ordersCount: orders.count ?? 0,
      messagesToday: messagesToday.count ?? 0,
    },
    activity,
    latestInteractions,
    latestLeads: (latestLeads.data ?? []) as LeadRow[],
    latestOrders: (latestOrders.data ?? []) as OrderRow[],
  };
}

export async function getBuilderPreview(workspaceId: string) {
  const supabase = await createServerSupabaseClient();
  const { data: bot } = await supabase
    .from("bots")
    .select("id, published_flow_id")
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  if (!bot?.published_flow_id) {
    return null;
  }

  const { data: nodesData } = await supabase
    .from("flow_nodes")
    .select("*, buttons:flow_buttons(*)")
    .eq("workspace_id", workspaceId)
    .eq("flow_id", bot.published_flow_id === null ? "" : bot.published_flow_id)
    .order("order_index", { ascending: true });
  const nodes = (nodesData ?? []) as unknown as NodePreviewRecord[];

  const startNode = nodes?.find((node) => node.is_start);

  if (!startNode) {
    return null;
  }

  return {
    ...startNode,
    parsedConfig: parseNodeConfig(startNode.config),
    buttons: startNode.buttons ?? [],
  };
}
