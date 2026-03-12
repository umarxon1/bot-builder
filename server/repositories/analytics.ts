import "server-only";

import { getDashboardOverview } from "@/server/repositories/dashboard";

export async function getAnalytics(workspaceId: string) {
  return getDashboardOverview(workspaceId);
}
