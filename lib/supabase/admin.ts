import "server-only";

import { createClient } from "@supabase/supabase-js";

import { getAuthServerEnv } from "@/lib/env.server";
import type { Database } from "@/types/database";

let adminClient: ReturnType<typeof createClient<Database>> | undefined;

export function createAdminSupabaseClient() {
  if (!adminClient) {
    const env = getAuthServerEnv();

    adminClient = createClient<Database>(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );
  }

  return adminClient;
}
