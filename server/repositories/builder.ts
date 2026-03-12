import "server-only";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  parseNodeConfig,
  type BuilderViewModel,
  type FlowButtonRow,
  type FlowNodeRow,
  type FlowRow,
} from "@/types/app";
import type { Json } from "@/types/database";

type NodeWithButtons = FlowNodeRow & {
  buttons: FlowButtonRow[];
};

function buildNodeKey(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export async function ensureDraftFlow(
  workspaceId: string,
  botId: string,
  botName = "Asosiy flow",
) {
  const admin = createAdminSupabaseClient();
  const { data: existingFlowData } = await admin
    .from("bot_flows")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("bot_id", botId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  const existingFlow = existingFlowData as FlowRow | null;

  if (existingFlow) {
    return existingFlow;
  }

  const { data: createdFlowData, error: flowError } = await admin
    .from("bot_flows")
    .insert({
      workspace_id: workspaceId,
      bot_id: botId,
      name: `${botName} Draft`,
      version: 1,
    })
    .select("*")
    .single();
  const createdFlow = createdFlowData as FlowRow | null;

  if (flowError || !createdFlow) {
    throw new Error(flowError?.message ?? "Flow yaratilmadi");
  }

  const { error: nodeError } = await admin.from("flow_nodes").insert({
    workspace_id: workspaceId,
    flow_id: createdFlow.id,
    key: "start",
    title: "Start",
    type: "menu",
    content:
      "Assalomu alaykum! BotBuilder Uz demo botiga xush kelibsiz. Quyidagi bo'limlardan birini tanlang.",
    is_start: true,
    order_index: 0,
  });

  if (nodeError) {
    throw new Error(nodeError.message);
  }

  return createdFlow;
}

export async function getBuilderData(workspaceId: string, botId: string) {
  const supabase = await createServerSupabaseClient();
  const flow = await ensureDraftFlow(workspaceId, botId);
  const { data: nodesData } = await supabase
    .from("flow_nodes")
    .select("*, buttons:flow_buttons(*)")
    .eq("workspace_id", workspaceId)
    .eq("flow_id", flow.id)
    .order("order_index", { ascending: true });
  const nodes = (nodesData ?? []) as unknown as NodeWithButtons[];

  const { data: botData } = await supabase
    .from("bots")
    .select("published_flow_id")
    .eq("id", botId)
    .maybeSingle();
  const bot = botData as { published_flow_id: string | null } | null;

  return {
    flow,
    nodes:
      nodes?.map((node) => ({
        ...node,
        parsedConfig: parseNodeConfig(node.config),
        buttons: node.buttons ?? [],
      })) ?? [],
    publishedFlowId: bot?.published_flow_id ?? null,
  } satisfies BuilderViewModel;
}

export async function getNodeOptions(workspaceId: string, flowId: string) {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("flow_nodes")
    .select("id, title, type, is_start")
    .eq("workspace_id", workspaceId)
    .eq("flow_id", flowId)
    .order("order_index", { ascending: true });

  return (data ?? []) as Array<Pick<FlowNodeRow, "id" | "title" | "type" | "is_start">>;
}

export async function createNodeRecord(input: {
  workspaceId: string;
  flowId: string;
  title: string;
  type: "message" | "menu" | "lead_capture" | "order_form" | "external_link";
  content: string;
  isStart: boolean;
  config: Record<string, unknown>;
}) {
  const admin = createAdminSupabaseClient();
  const { data: currentNodesData } = await admin
    .from("flow_nodes")
    .select("id, order_index")
    .eq("flow_id", input.flowId)
    .order("order_index", { ascending: false })
    .limit(1);
  const currentNodes = (currentNodesData ?? []) as Array<Pick<FlowNodeRow, "id" | "order_index">>;

  if (input.isStart) {
    await admin
      .from("flow_nodes")
      .update({ is_start: false })
      .eq("flow_id", input.flowId)
      .eq("workspace_id", input.workspaceId);
  }

  const { data: nodeData, error } = await admin
    .from("flow_nodes")
    .insert({
      workspace_id: input.workspaceId,
      flow_id: input.flowId,
      key: `${buildNodeKey(input.title)}_${Date.now().toString(36)}`,
      title: input.title,
      type: input.type,
      content: input.content,
      config: input.config as Json,
      is_start: input.isStart,
      order_index: (currentNodes?.[0]?.order_index ?? -1) + 1,
    })
    .select("*")
    .single();
  const data = nodeData as FlowNodeRow | null;

  if (error || !data) {
    throw new Error(error?.message ?? "Node yaratilmadi");
  }

  return data;
}

export async function updateNodeRecord(input: {
  workspaceId: string;
  nodeId: string;
  title: string;
  type: "message" | "menu" | "lead_capture" | "order_form" | "external_link";
  content: string;
  isStart: boolean;
  config: Record<string, unknown>;
}) {
  const admin = createAdminSupabaseClient();

  if (input.isStart) {
    const { data: nodeData } = await admin
      .from("flow_nodes")
      .select("flow_id")
      .eq("id", input.nodeId)
      .maybeSingle();
    const node = nodeData as Pick<FlowNodeRow, "flow_id"> | null;

    if (node?.flow_id) {
      await admin
        .from("flow_nodes")
        .update({ is_start: false })
        .eq("flow_id", node.flow_id)
        .eq("workspace_id", input.workspaceId);
    }
  }

  const { error } = await admin
    .from("flow_nodes")
    .update({
      title: input.title,
      type: input.type,
      content: input.content,
      config: input.config as Json,
      is_start: input.isStart,
    })
    .eq("id", input.nodeId)
    .eq("workspace_id", input.workspaceId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function upsertButtonRecord(input: {
  workspaceId: string;
  nodeId: string;
  buttonId?: string;
  label: string;
  kind: "navigate" | "url";
  targetNodeId?: string | null;
  url?: string | null;
}) {
  const admin = createAdminSupabaseClient();

  if (input.buttonId) {
    const { error } = await admin
      .from("flow_buttons")
      .update({
        label: input.label,
        kind: input.kind,
        target_node_id: input.targetNodeId ?? null,
        url: input.kind === "url" ? input.url ?? null : null,
      })
      .eq("id", input.buttonId)
      .eq("workspace_id", input.workspaceId);

    if (error) {
      throw new Error(error.message);
    }

    return;
  }

  const { data: latestButtonData } = await admin
    .from("flow_buttons")
    .select("order_index")
    .eq("node_id", input.nodeId)
    .order("order_index", { ascending: false })
    .limit(1);
  const latestButton = (latestButtonData ?? []) as Array<Pick<FlowButtonRow, "order_index">>;

  const { error } = await admin.from("flow_buttons").insert({
    workspace_id: input.workspaceId,
    node_id: input.nodeId,
    label: input.label,
    kind: input.kind,
    target_node_id: input.targetNodeId ?? null,
    url: input.kind === "url" ? input.url ?? null : null,
    order_index: (latestButton?.[0]?.order_index ?? -1) + 1,
  });

  if (error) {
    throw new Error(error.message);
  }
}
