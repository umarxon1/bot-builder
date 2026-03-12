import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { LeadRow } from "@/types/app";

export type LeadListItem = LeadRow & {
  bot_user?: {
    first_name?: string | null;
    last_name?: string | null;
    username?: string | null;
  } | null;
};

export async function getLeads(
  workspaceId: string,
  search?: string,
): Promise<LeadListItem[]> {
  const supabase = await createServerSupabaseClient();
  let query = supabase
    .from("leads")
    .select("*, bot_user:bot_users(first_name, last_name, username)")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (search) {
    query = query.or(`full_name.ilike.%${search}%,phone.ilike.%${search}%`);
  }

  const { data } = await query;
  return (data ?? []) as unknown as LeadListItem[];
}
