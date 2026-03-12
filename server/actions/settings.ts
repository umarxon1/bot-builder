"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { actionError, actionSuccess, type ActionResult } from "@/server/actions/types";
import { requireWorkspaceContext } from "@/server/repositories/context";
import { updateWorkspaceRecord } from "@/server/repositories/workspaces";

const updateWorkspaceSchema = z.object({
  name: z.string().min(2, "Workspace nomini kiriting."),
});

export async function updateWorkspaceAction(
  input: unknown,
): Promise<ActionResult<undefined>> {
  const parsed = updateWorkspaceSchema.safeParse(input);

  if (!parsed.success) {
    return actionError(
      "Workspace ma'lumotlarini tekshiring",
      parsed.error.flatten().fieldErrors,
    );
  }

  const context = await requireWorkspaceContext();

  try {
    await updateWorkspaceRecord({
      workspaceId: context.workspace.id,
      name: parsed.data.name,
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/settings");
    return actionSuccess("Workspace yangilandi.");
  } catch (error) {
    return actionError(
      error instanceof Error ? error.message : "Workspace yangilanmadi",
    );
  }
}
