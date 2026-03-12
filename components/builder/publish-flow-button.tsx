"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { publishFlowAction } from "@/server/actions/builder";
import { Button } from "@/components/ui/button";

export function PublishFlowButton({
  flowId,
  botId,
}: {
  flowId: string;
  botId: string;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      onClick={() =>
        startTransition(async () => {
          const result = await publishFlowAction({ flowId, botId });

          if (!result?.success) {
            toast.error(result?.error ?? "Flow chop etilmadi.");
            return;
          }

          toast.success(result.message ?? "Flow chop etildi.");
        })
      }
      disabled={isPending}
    >
      {isPending ? "Chop etilmoqda..." : "Flowni publish qilish"}
    </Button>
  );
}
