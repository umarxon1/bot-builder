import "server-only";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { slugify } from "@/lib/utils/slug";
import type { WorkspaceRow } from "@/types/app";

async function getAvailableSlug(baseName: string) {
  const admin = createAdminSupabaseClient();
  const baseSlug = slugify(baseName) || "workspace";
  const { data: slugData } = await admin
    .from("workspaces")
    .select("slug")
    .ilike("slug", `${baseSlug}%`);
  const data = (slugData ?? []) as Array<{ slug: string }>;

  const existing = new Set(data?.map((item) => item.slug) ?? []);

  if (!existing.has(baseSlug)) {
    return baseSlug;
  }

  let suffix = 2;
  while (existing.has(`${baseSlug}-${suffix}`)) {
    suffix += 1;
  }

  return `${baseSlug}-${suffix}`;
}

export async function provisionWorkspaceForUser(input: {
  userId: string;
  email: string;
  fullName: string;
  workspaceName: string;
}) {
  const admin = createAdminSupabaseClient();

  const { data: membershipData } = await admin
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", input.userId)
    .limit(1)
    .maybeSingle();
  const existingMembership = membershipData as { workspace_id: string } | null;

  if (existingMembership?.workspace_id) {
    return existingMembership.workspace_id;
  }

  const slug = await getAvailableSlug(input.workspaceName);
  const { data: workspaceData, error: workspaceError } = await admin
    .from("workspaces")
    .insert({
      name: input.workspaceName,
      slug,
      owner_user_id: input.userId,
    })
    .select("*")
    .single();
  const workspace = workspaceData as WorkspaceRow | null;

  if (workspaceError || !workspace) {
    throw new Error(workspaceError?.message ?? "Workspace yaratilmadi");
  }

  const updates = await Promise.all([
    admin.from("profiles").upsert({
      id: input.userId,
      email: input.email,
      full_name: input.fullName,
      default_workspace_id: workspace.id,
    }),
    admin.from("workspace_members").insert({
      workspace_id: workspace.id,
      user_id: input.userId,
      role: "owner",
    }),
  ]);

  const failed = updates.find((result) => result.error);

  if (failed?.error) {
    throw new Error(failed.error.message);
  }

  return workspace.id;
}

export async function updateWorkspaceRecord(input: {
  workspaceId: string;
  name: string;
}) {
  const admin = createAdminSupabaseClient();
  const slug = await getAvailableSlug(input.name);
  const { error } = await admin
    .from("workspaces")
    .update({ name: input.name, slug })
    .eq("id", input.workspaceId);

  if (error) {
    throw new Error(error.message);
  }
}
