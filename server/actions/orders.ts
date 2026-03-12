"use server";

import { revalidatePath } from "next/cache";

import { actionError, actionSuccess, type ActionResult } from "@/server/actions/types";
import { updateOrderStatusSchema } from "@/lib/validations/order";
import { requireWorkspaceContext } from "@/server/repositories/context";
import { updateOrderStatusRecord } from "@/server/repositories/orders";

export async function updateOrderStatusAction(
  input: unknown,
): Promise<ActionResult<undefined>> {
  const parsed = updateOrderStatusSchema.safeParse(input);

  if (!parsed.success) {
    return actionError("Buyurtma holati noto'g'ri", parsed.error.flatten().fieldErrors);
  }

  const context = await requireWorkspaceContext();

  try {
    await updateOrderStatusRecord({
      workspaceId: context.workspace.id,
      orderId: parsed.data.orderId,
      status: parsed.data.status,
    });

    revalidatePath("/dashboard/orders");
    revalidatePath("/dashboard");
    return actionSuccess("Buyurtma holati yangilandi.");
  } catch (error) {
    return actionError(
      error instanceof Error ? error.message : "Buyurtma yangilanmadi",
    );
  }
}
