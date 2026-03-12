import { Pool, type PoolConfig, type QueryResultRow } from "pg";

import { getServerEnv } from "@/lib/env.server";
import { logger } from "@/lib/logger";

declare global {
  var __botbuilderPostgresPool: Pool | undefined;
}

function getPoolConfig(): PoolConfig {
  const env = getServerEnv();

  return {
    connectionString: env.DATABASE_URL,
    host: env.DATABASE_HOST,
    port: env.DATABASE_PORT,
    database: env.DATABASE_NAME,
    user: env.DATABASE_USER,
    password: env.DATABASE_PASSWORD,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
    ssl:
      env.DATABASE_HOST === "localhost" || env.DATABASE_HOST === "127.0.0.1"
        ? false
        : { rejectUnauthorized: false },
  };
}

export function getPostgresPool() {
  if (!global.__botbuilderPostgresPool) {
    global.__botbuilderPostgresPool = new Pool(getPoolConfig());
    global.__botbuilderPostgresPool.on("error", (error) => {
      logger.error("postgres.pool_error", { message: error.message });
    });
  }

  return global.__botbuilderPostgresPool;
}

export async function query<T extends QueryResultRow>(
  text: string,
  params: unknown[] = [],
) {
  try {
    return await getPostgresPool().query<T>(text, params);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown query error";

    logger.error("postgres.query_failed", {
      message,
      query: text,
      parameterCount: params.length,
    });

    throw new Error(`Database query failed: ${message}`);
  }
}

export async function testPostgresConnection() {
  const result = await query<{ current_database: string }>(
    "select current_database()",
  );

  return result.rows[0]?.current_database ?? null;
}
