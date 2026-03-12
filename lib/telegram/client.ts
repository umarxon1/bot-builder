import "server-only";

import { logger } from "@/lib/logger";
import { maskSecret } from "@/lib/utils/security";
import type {
  TelegramBotMeta,
  TelegramCallbackQuery,
  TelegramUpdate,
} from "@/types/telegram";

type TelegramApiResponse<T> = {
  ok: boolean;
  result?: T;
  description?: string;
  error_code?: number;
};

type TelegramKeyboard =
  | {
      inline_keyboard: Array<Array<{ text: string; callback_data?: string; url?: string }>>;
    }
  | {
      keyboard: Array<Array<{ text: string; request_contact?: boolean }>>;
      resize_keyboard?: boolean;
      one_time_keyboard?: boolean;
    };

type SendMessagePayload = {
  chat_id: number | string;
  text: string;
  reply_markup?: TelegramKeyboard;
};

async function callTelegramApi<T>(
  token: string,
  method: string,
  body?: Record<string, unknown>,
) {
  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: body ? "POST" : "GET",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  const payload = (await response.json()) as TelegramApiResponse<T>;

  if (!payload.ok || !payload.result) {
    const description = payload.description ?? "Unknown Telegram API error";

    logger.warn("telegram.api_error", {
      method,
      token: maskSecret(token),
      description,
      status: response.status,
    });

    throw new Error(description);
  }

  return payload.result;
}

export async function verifyTelegramBotToken(token: string) {
  return callTelegramApi<TelegramBotMeta>(token, "getMe");
}

export async function setTelegramWebhook(input: {
  token: string;
  url: string;
  secretToken: string;
}) {
  await callTelegramApi<boolean>(input.token, "setWebhook", {
    url: input.url,
    secret_token: input.secretToken,
    drop_pending_updates: false,
  });
}

export async function sendTelegramMessage(token: string, payload: SendMessagePayload) {
  return callTelegramApi(token, "sendMessage", payload);
}

export async function answerTelegramCallbackQuery(
  token: string,
  callbackQueryId: TelegramCallbackQuery["id"],
  text?: string,
) {
  return callTelegramApi<boolean>(token, "answerCallbackQuery", {
    callback_query_id: callbackQueryId,
    text,
  });
}

export function buildInlineKeyboard(
  buttons: Array<{ text: string; callbackData?: string; url?: string }>,
) {
  return {
    inline_keyboard: buttons.map((button) => [
      {
        text: button.text,
        callback_data: button.callbackData,
        url: button.url,
      },
    ]),
  } satisfies TelegramKeyboard;
}

export function buildContactKeyboard(label = "Telefon raqamni yuborish") {
  return {
    keyboard: [[{ text: label, request_contact: true }]],
    resize_keyboard: true,
    one_time_keyboard: true,
  } satisfies TelegramKeyboard;
}

export function getUpdateMessage(update: TelegramUpdate) {
  return update.message ?? update.callback_query?.message ?? null;
}
