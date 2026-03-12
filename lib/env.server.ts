import { z } from "zod";

const authServerEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
});

const databaseEnvSchema = z.object({
  DATABASE_HOST: z.string().min(1),
  DATABASE_PORT: z.coerce.number().int().positive().default(5432),
  DATABASE_NAME: z.string().min(1).default("umarxonsdb"),
  DATABASE_USER: z.string().min(1),
  DATABASE_PASSWORD: z.string().min(1),
  DATABASE_URL: z.string().min(1),
});

const securityEnvSchema = z.object({
  TELEGRAM_WEBHOOK_BASE_URL: z.string().url(),
  TELEGRAM_ENCRYPTION_SECRET: z.string().min(16),
  APP_ENCRYPTION_KEY: z.string().min(16),
});

const serverEnvSchema = authServerEnvSchema
  .merge(databaseEnvSchema)
  .merge(securityEnvSchema);

export type ServerEnv = z.infer<typeof serverEnvSchema>;
export type AuthServerEnv = z.infer<typeof authServerEnvSchema>;
export type DatabaseEnv = z.infer<typeof databaseEnvSchema>;
export type SecurityEnv = z.infer<typeof securityEnvSchema>;

function formatEnvIssues(issues: z.ZodIssue[]) {
  return issues
    .map((issue) => issue.path.join("."))
    .filter(Boolean)
    .join(", ");
}

function getRawServerEnv() {
  return {
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
  };
}

function parseEnv<T>(schema: z.ZodSchema<T>, scope: string): T {
  const result = schema.safeParse(getRawServerEnv());

  if (!result.success) {
    throw new Error(
      `Missing or invalid ${scope} environment variables: ${formatEnvIssues(result.error.issues)}. Copy .env.example to .env.local and fill the required values.`,
    );
  }

  return result.data;
}

export function getServerEnv(): ServerEnv {
  return parseEnv(serverEnvSchema, "server");
}

export function getAuthServerEnv(): AuthServerEnv {
  return parseEnv(authServerEnvSchema, "auth server");
}

export function getDatabaseEnv(): DatabaseEnv {
  return parseEnv(databaseEnvSchema, "database");
}

export function getSecurityEnv(): SecurityEnv {
  return parseEnv(securityEnvSchema, "security");
}
