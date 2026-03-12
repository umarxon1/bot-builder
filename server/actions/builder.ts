"use server";

import { revalidatePath } from "next/cache";

import { actionError, actionSuccess, type ActionResult } from "@/server/actions/types";
import {
  buttonSchema,
  createNodeSchema,
  publishFlowSchema,
  updateNodeSchema,
} from "@/lib/validations/builder";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { requireWorkspaceContext } from "@/server/repositories/context";
import {
  createNodeRecord,
  updateNodeRecord,
  upsertButtonRecord,
} from "@/server/repositories/builder";

function buildConfig(data: {
  nextNodeId?: string;
  successMessage?: string;
  productName?: string;
  url?: string;
  buttonLabel?: string;
}) {
  return {
    nextNodeId: data.nextNodeId || null,
    successMessage: data.successMessage || null,
    productName: data.productName || null,
    url: data.url || null,
    buttonLabel: data.buttonLabel || null,
  };
}

function revalidateBuilderRoutes() {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/builder");
  revalidatePath("/dashboard/bot");
}

export async function createNodeAction(
  input: unknown,
): Promise<ActionResult<undefined>> {
  const parsed = createNodeSchema.safeParse(input);

  if (!parsed.success) {
    return actionError("Node formasi noto'g'ri", parsed.error.flatten().fieldErrors);
  }

  const context = await requireWorkspaceContext();

  try {
    await createNodeRecord({
      workspaceId: context.workspace.id,
      flowId: parsed.data.flowId,
      title: parsed.data.title,
      type: parsed.data.type,
      content: parsed.data.content,
      isStart: parsed.data.isStart,
      config: buildConfig(parsed.data),
    });

    revalidateBuilderRoutes();
    return actionSuccess("Yangi node yaratildi.");
  } catch (error) {
    return actionError(error instanceof Error ? error.message : "Node yaratilmadi");
  }
}

export async function updateNodeAction(
  input: unknown,
): Promise<ActionResult<undefined>> {
  const parsed = updateNodeSchema.safeParse(input);

  if (!parsed.success) {
    return actionError("Node formasi noto'g'ri", parsed.error.flatten().fieldErrors);
  }

  const context = await requireWorkspaceContext();

  try {
    await updateNodeRecord({
      workspaceId: context.workspace.id,
      nodeId: parsed.data.nodeId,
      title: parsed.data.title,
      type: parsed.data.type,
      content: parsed.data.content,
      isStart: parsed.data.isStart,
      config: buildConfig(parsed.data),
    });

    revalidateBuilderRoutes();
    return actionSuccess("Node yangilandi.");
  } catch (error) {
    return actionError(error instanceof Error ? error.message : "Node yangilanmadi");
  }
}

export async function saveButtonAction(
  input: unknown,
): Promise<ActionResult<undefined>> {
  const parsed = buttonSchema.safeParse(input);

  if (!parsed.success) {
    return actionError("Button formasi noto'g'ri", parsed.error.flatten().fieldErrors);
  }

  const context = await requireWorkspaceContext();

  if (parsed.data.kind === "navigate" && !parsed.data.targetNodeId) {
    return actionError("Navigatsiya uchun target node tanlang.");
  }

  if (parsed.data.kind === "url" && !parsed.data.url) {
    return actionError("URL button uchun havola kiriting.");
  }

  try {
    await upsertButtonRecord({
      workspaceId: context.workspace.id,
      nodeId: parsed.data.nodeId,
      buttonId: parsed.data.buttonId,
      label: parsed.data.label,
      kind: parsed.data.kind,
      targetNodeId: parsed.data.targetNodeId || null,
      url: parsed.data.url || null,
    });

    revalidateBuilderRoutes();
    return actionSuccess("Button saqlandi.");
  } catch (error) {
    return actionError(error instanceof Error ? error.message : "Button saqlanmadi");
  }
}

export async function publishFlowAction(
  input: unknown,
): Promise<ActionResult<undefined>> {
  const parsed = publishFlowSchema.safeParse(input);

  if (!parsed.success) {
    return actionError("Publish ma'lumotlari noto'g'ri", parsed.error.flatten().fieldErrors);
  }

  const context = await requireWorkspaceContext();
  const admin = createAdminSupabaseClient();
  const { data: startNode } = await admin
    .from("flow_nodes")
    .select("id")
    .eq("flow_id", parsed.data.flowId)
    .eq("workspace_id", context.workspace.id)
    .eq("is_start", true)
    .maybeSingle();

  if (!startNode) {
    return actionError("Start node belgilanmagan. Kamida bitta start node kerak.");
  }

  const updates = await Promise.all([
    admin
      .from("bot_flows")
      .update({ is_published: false })
      .eq("bot_id", parsed.data.botId)
      .eq("workspace_id", context.workspace.id),
    admin
      .from("bot_flows")
      .update({ is_published: true, published_at: new Date().toISOString() })
      .eq("id", parsed.data.flowId)
      .eq("workspace_id", context.workspace.id),
    admin
      .from("bots")
      .update({ published_flow_id: parsed.data.flowId })
      .eq("id", parsed.data.botId)
      .eq("workspace_id", context.workspace.id),
    admin.from("interaction_logs").insert({
      workspace_id: context.workspace.id,
      bot_id: parsed.data.botId,
      direction: "system",
      event_type: "flow_publish",
      message_text: "Flow published",
      metadata: { flowId: parsed.data.flowId, publishedBy: context.userId },
    }),
  ]);

  const failed = updates.find((result) => result.error);

  if (failed?.error) {
    return actionError(failed.error.message);
  }

  revalidateBuilderRoutes();
  revalidatePath("/dashboard/analytics");

  return actionSuccess("Flow chop etildi va botga ulandi.");
}
