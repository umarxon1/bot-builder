import { z } from "zod";

export const botTokenSchema = z.object({
  token: z
    .string()
    .min(10, "Bot token juda qisqa.")
    .regex(/^\d+:[A-Za-z0-9_-]+$/, "BotFather token formatini tekshiring."),
});

export const activateWebhookSchema = z.object({
  botId: z.string().uuid("Bot identifikatori noto'g'ri."),
});

export type BotTokenInput = z.infer<typeof botTokenSchema>;
export type ActivateWebhookInput = z.infer<typeof activateWebhookSchema>;
