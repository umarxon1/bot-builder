import { z } from "zod";

const serverEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  DATABASE_HOST: z.string().min(1),
  DATABASE_PORT: z.coerce.number().int().positive().default(5432),
  DATABASE_NAME: z.string().min(1).default("umarxonsdb"),
  DATABASE_USER: z.string().min(1),
  DATABASE_PASSWORD: z.string().min(1),
  DATABASE_URL: z.string().min(1),
  TELEGRAM_WEBHOOK_BASE_URL: z.string().url(),
  TELEGRAM_ENCRYPTION_SECRET: z.string().min(16),
  APP_ENCRYPTION_KEY: z.string().min(16),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

function formatEnvIssues(issues: z.ZodIssue[]) {
  return issues
    .map((issue) => issue.path.join("."))
    .filter(Boolean)
    .join(", ");
}

export function getServerEnv(): ServerEnv {
  const result = serverEnvSchema.safeParse({
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    DATABASE_HOST: process.env.DATABASE_HOST,
    DATABASE_PORT: process.env.DATABASE_PORT,
    DATABASE_NAME: process.env.DATABASE_NAME ?? "umarxonsdb",
    DATABASE_USER: process.env.DATABASE_USER,
    DATABASE_PASSWORD: process.env.DATABASE_PASSWORD,
    DATABASE_URL: process.env.DATABASE_URL,
    TELEGRAM_WEBHOOK_BASE_URL: process.env.TELEGRAM_WEBHOOK_BASE_URL,
    TELEGRAM_ENCRYPTION_SECRET: process.env.TELEGRAM_ENCRYPTION_SECRET,
    APP_ENCRYPTION_KEY: process.env.APP_ENCRYPTION_KEY,
  });

  if (!result.success) {
    throw new Error(
      `Missing or invalid server environment variables: ${formatEnvIssues(result.error.issues)}. Copy .env.example to .env.local and fill the required values.`,
    );
  }

  return result.data;
}
