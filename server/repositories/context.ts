import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { BotConnectionRow, BotRow, WorkspaceContext, WorkspaceRow } from "@/types/app";
import type { Database } from "@/types/database";

export const getWorkspaceContext = cache(async (): Promise<WorkspaceContext | null> => {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const [{ data: profile }, { data: membership }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase
      .from("workspace_members")
      .select("*")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle(),
  ]);
  const typedMembership = membership as Database["public"]["Tables"]["workspace_members"]["Row"] | null;

  if (!typedMembership?.workspace_id) {
    return null;
  }

  const [{ data: workspaceData }, { data: botData }, { data: connectionData }] =
    await Promise.all([
      supabase
        .from("workspaces")
        .select("*")
        .eq("id", typedMembership.workspace_id)
        .single(),
      supabase
        .from("bots")
        .select("*")
        .eq("workspace_id", typedMembership.workspace_id)
        .maybeSingle(),
      supabase
        .from("bot_connections")
        .select("*")
        .eq("workspace_id", typedMembership.workspace_id)
        .maybeSingle(),
    ]);

  const workspace = workspaceData as WorkspaceRow | null;

  if (!workspace) {
    return null;
  }

  const bot = botData as BotRow | null;
  const connection = connectionData as BotConnectionRow | null;
  const typedProfile =
    (profile as Database["public"]["Tables"]["profiles"]["Row"] | null) ?? null;

  return {
    userId: user.id,
    email: user.email ?? "",
    fullName:
      typedProfile?.full_name ??
      (typeof user.user_metadata?.full_name === "string"
        ? user.user_metadata.full_name
        : null),
    workspace,
    bot: bot ? { ...bot, connection } : null,
  };
});

export async function requireWorkspaceContext() {
  const context = await getWorkspaceContext();

  if (!context) {
    redirect("/login");
  }

  return context;
}
