"use server";

import { revalidatePath } from "next/cache";

import { logger } from "@/lib/logger";
import { sendTelegramMessage } from "@/lib/telegram/client";
import {
  previewBroadcastSchema,
  sendBroadcastSchema,
} from "@/lib/validations/broadcast";
import { getBotTokenForWebhook } from "@/server/repositories/bots";
import {
  createBroadcastRecord,
  getBroadcastAudience,
  insertBroadcastDelivery,
  markBroadcastCompleted,
} from "@/server/repositories/broadcasts";
import { requireWorkspaceContext } from "@/server/repositories/context";
import { actionError, actionSuccess, type ActionResult } from "@/server/actions/types";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function previewBroadcastAction(
  input: unknown,
): Promise<ActionResult<{ recipientCount: number }>> {
  const parsed = previewBroadcastSchema.safeParse(input);

  if (!parsed.success) {
    return actionError("Broadcast formasi noto'g'ri", parsed.error.flatten().fieldErrors);
  }

  const context = await requireWorkspaceContext();

  if (!context.bot) {
    return actionError("Avval Telegram botni ulang.");
  }

  const audience = await getBroadcastAudience(context.workspace.id, context.bot.id);

  return actionSuccess("Preview tayyor.", {
    recipientCount: audience.count,
  });
}

export async function sendBroadcastAction(
  input: unknown,
): Promise<ActionResult<{ recipientCount: number; sentCount: number; failedCount: number }>> {
  const parsed = sendBroadcastSchema.safeParse(input);

  if (!parsed.success) {
    return actionError("Broadcast formasi noto'g'ri", parsed.error.flatten().fieldErrors);
  }

  const context = await requireWorkspaceContext();

  if (!context.bot) {
    return actionError("Broadcast yuborish uchun bot ulangan bo'lishi kerak.");
  }

  const audience = await getBroadcastAudience(context.workspace.id, context.bot.id);

  if (!audience.count) {
    return actionError("Broadcast uchun foydalanuvchi topilmadi.");
  }

  const broadcast = await createBroadcastRecord({
    workspaceId: context.workspace.id,
    botId: context.bot.id,
    createdByUserId: context.userId,
    title: parsed.data.title,
    message: parsed.data.message,
    previewRecipientCount: audience.count,
  });

  const { token } = await getBotTokenForWebhook(context.bot.id);
  let sentCount = 0;
  let failedCount = 0;
  const batchSize = 20;

  for (let index = 0; index < audience.recipients.length; index += batchSize) {
    const batch = audience.recipients.slice(index, index + batchSize);

    await Promise.all(
      batch.map(async (recipient) => {
        try {
          await sendTelegramMessage(token, {
            chat_id: recipient.chat_id,
            text: parsed.data.message,
          });

          sentCount += 1;

          await insertBroadcastDelivery({
            workspaceId: context.workspace.id,
            broadcastId: broadcast.id,
            botUserId: recipient.id,
            telegramChatId: recipient.chat_id,
            status: "sent",
          });
        } catch (error) {
          failedCount += 1;

          await insertBroadcastDelivery({
            workspaceId: context.workspace.id,
            broadcastId: broadcast.id,
            botUserId: recipient.id,
            telegramChatId: recipient.chat_id,
            status: "failed",
            errorMessage:
              error instanceof Error ? error.message.slice(0, 180) : "Unknown error",
          });
        }
      }),
    );

    logger.info("broadcast.batch_processed", {
      workspaceId: context.workspace.id,
      broadcastId: broadcast.id,
      batchIndex: index / batchSize,
      processed: Math.min(index + batchSize, audience.recipients.length),
    });

    if (index + batchSize < audience.recipients.length) {
      await sleep(1_100);
    }
  }

  await markBroadcastCompleted({
    broadcastId: broadcast.id,
    sentCount,
    failedCount,
    status: failedCount > 0 ? "failed" : "sent",
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/broadcasts");
  revalidatePath("/dashboard/analytics");

  return actionSuccess("Broadcast yuborildi.", {
    recipientCount: audience.count,
    sentCount,
    failedCount,
  });
}
