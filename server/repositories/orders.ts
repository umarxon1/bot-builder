import "server-only";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { OrderRow, OrderStatus } from "@/types/app";

export async function getOrders(
  workspaceId: string,
  status?: OrderStatus | "all",
): Promise<OrderRow[]> {
  const supabase = await createServerSupabaseClient();
  let query = supabase
    .from("orders")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  const { data } = await query;
  return (data ?? []) as OrderRow[];
}

export async function updateOrderStatusRecord(input: {
  workspaceId: string;
  orderId: string;
  status: OrderStatus;
}) {
  const admin = createAdminSupabaseClient();
  const { error } = await admin
    .from("orders")
    .update({ status: input.status })
    .eq("id", input.orderId)
    .eq("workspace_id", input.workspaceId);

  if (error) {
    throw new Error(error.message);
  }
}
