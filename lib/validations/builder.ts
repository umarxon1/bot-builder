import { z } from "zod";

const optionalUrl = z
  .string()
  .trim()
  .optional()
  .transform((value) => value || undefined)
  .refine((value) => !value || /^https?:\/\//.test(value), {
    message: "URL `https://` bilan boshlansin.",
  });

export const createNodeSchema = z.object({
  flowId: z.string().uuid(),
  title: z.string().min(2, "Node nomini kiriting."),
  type: z.enum(["message", "menu", "lead_capture", "order_form", "external_link"]),
  content: z.string().min(1, "Kontent kiriting."),
  isStart: z.boolean().default(false),
  nextNodeId: z.string().uuid().optional().or(z.literal("")),
  successMessage: z.string().optional(),
  productName: z.string().optional(),
  url: optionalUrl,
  buttonLabel: z.string().optional(),
});

export const updateNodeSchema = createNodeSchema.extend({
  nodeId: z.string().uuid(),
});

export const buttonSchema = z.object({
  nodeId: z.string().uuid(),
  buttonId: z.string().uuid().optional(),
  label: z.string().min(1, "Button matnini kiriting."),
  kind: z.enum(["navigate", "url"]),
  targetNodeId: z.string().uuid().optional().or(z.literal("")),
  url: optionalUrl,
});

export const deleteButtonSchema = z.object({
  buttonId: z.string().uuid(),
});

export const publishFlowSchema = z.object({
  flowId: z.string().uuid(),
  botId: z.string().uuid(),
});

export type CreateNodeInput = z.infer<typeof createNodeSchema>;
export type UpdateNodeInput = z.infer<typeof updateNodeSchema>;
export type ButtonInput = z.infer<typeof buttonSchema>;
export type DeleteButtonInput = z.infer<typeof deleteButtonSchema>;
export type PublishFlowInput = z.infer<typeof publishFlowSchema>;
