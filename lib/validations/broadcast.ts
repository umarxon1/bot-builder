import { z } from "zod";

export const previewBroadcastSchema = z.object({
  title: z.string().min(2, "Broadcast sarlavhasini kiriting."),
  message: z.string().min(3, "Broadcast matni juda qisqa."),
});

export const sendBroadcastSchema = previewBroadcastSchema.extend({
  confirmSend: z.boolean().refine((value) => value, {
    message: "Yuborishdan oldin tasdiqlang.",
  }),
});

export type PreviewBroadcastInput = z.infer<typeof previewBroadcastSchema>;
export type SendBroadcastInput = z.infer<typeof sendBroadcastSchema>;
