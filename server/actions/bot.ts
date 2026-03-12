"use server";

import { revalidatePath } from "next/cache";

import { actionError, actionSuccess, type ActionResult } from "@/server/actions/types";
import { activateWebhookSchema, botTokenSchema } from "@/lib/validations/bot";
import { requireWorkspaceContext } from "@/server/repositories/context";
import {
  activateBotWebhook,
  verifyAndStoreBotToken,
} from "@/server/repositories/bots";

export async function verifyBotTokenAction(
  input: unknown,
): Promise<ActionResult<{ botUsername: string | null }>> {
  const parsed = botTokenSchema.safeParse(input);

  if (!parsed.success) {
    return actionError("Token formatini tekshiring", parsed.error.flatten().fieldErrors);
  }

  const context = await requireWorkspaceContext();

  try {
    const result = await verifyAndStoreBotToken({
      workspaceId: context.workspace.id,
      token: parsed.data.token,
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/bot");
    revalidatePath("/dashboard/builder");

    return actionSuccess("Bot muvaffaqiyatli ulandi.", {
      botUsername: result.botMeta.username ?? null,
    });
  } catch (error) {
    return actionError(
      error instanceof Error ? error.message : "Bot token tasdiqlanmadi",
    );
  }
}

export async function activateWebhookAction(
  input: unknown,
): Promise<ActionResult<undefined>> {
  const parsed = activateWebhookSchema.safeParse(input);

  if (!parsed.success) {
    return actionError("Webhook ma'lumotlari noto'g'ri", parsed.error.flatten().fieldErrors);
  }

  const context = await requireWorkspaceContext();

  try {
    await activateBotWebhook({
      workspaceId: context.workspace.id,
      botId: parsed.data.botId,
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/bot");

    return actionSuccess("Webhook faollashtirildi.");
  } catch (error) {
    return actionError(error instanceof Error ? error.message : "Webhook yoqilmadi");
  }
}
