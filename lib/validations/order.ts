import { z } from "zod";

export const updateOrderStatusSchema = z.object({
  orderId: z.string().uuid(),
  status: z.enum(["new", "contacted", "completed", "cancelled"]),
});

export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
