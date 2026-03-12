"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { updateOrderStatusAction } from "@/server/actions/orders";
import type { OrderStatus } from "@/types/app";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";

export function OrderStatusForm({
  orderId,
  status,
}: {
  orderId: string;
  status: OrderStatus;
}) {
  const [currentStatus, setCurrentStatus] = useState<OrderStatus>(status);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-2">
      <Select
        value={currentStatus}
        onChange={(event) => setCurrentStatus(event.target.value as OrderStatus)}
      >
        <option value="new">new</option>
        <option value="contacted">contacted</option>
        <option value="completed">completed</option>
        <option value="cancelled">cancelled</option>
      </Select>
      <Button
        type="button"
        variant="secondary"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            const result = await updateOrderStatusAction({ orderId, status: currentStatus });

            if (!result?.success) {
              toast.error(result?.error ?? "Buyurtma yangilanmadi.");
              return;
            }

            toast.success(result.message ?? "Buyurtma holati yangilandi.");
          })
        }
      >
        Saqlash
      </Button>
    </div>
  );
}
