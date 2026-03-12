import { z } from "zod";
import { timingSafeEqual } from "crypto";

import { logger } from "@/lib/logger";
import { hashText } from "@/lib/security/encryption";
import { processTelegramUpdate } from "@/lib/telegram/engine";
import { getBotTokenForWebhook } from "@/server/repositories/bots";

const telegramUpdateSchema = z.object({
  update_id: z.number(),
  message: z.any().optional(),
  callback_query: z.any().optional(),
});

function safeHashCompare(a: string, b: string) {
  const first = Buffer.from(a);
  const second = Buffer.from(b);

  if (first.length !== second.length) {
    return false;
  }

  return timingSafeEqual(first, second);
}

export async function POST(
  request: Request,
  context: { params: Promise<{ botId: string }> },
) {
  const { botId } = await context.params;
  const secretHeader = request.headers.get("x-telegram-bot-api-secret-token");

  if (!secretHeader) {
    return new Response("Missing webhook secret", { status: 401 });
  }

  try {
    const payload = await request.json();
    const parsed = telegramUpdateSchema.safeParse(payload);

    if (!parsed.success) {
      return new Response("Invalid update payload", { status: 400 });
    }

    const { bot, connection, token } = await getBotTokenForWebhook(botId);

    if (
      !connection.webhook_secret_hash ||
      !safeHashCompare(hashText(secretHeader), connection.webhook_secret_hash)
    ) {
      return new Response("Invalid webhook secret", { status: 401 });
    }

    await processTelegramUpdate({
      botId,
      workspaceId: bot.workspace_id,
      token,
      update: parsed.data,
    });

    return Response.json({ ok: true });
  } catch (error) {
    logger.error("telegram.webhook_failed", {
      botId,
      message: error instanceof Error ? error.message : "Unknown error",
    });

    return new Response("Webhook processing failed", { status: 500 });
  }
}
