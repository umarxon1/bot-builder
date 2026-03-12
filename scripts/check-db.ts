import { testPostgresConnection } from "../lib/db/postgres-core";

async function main() {
  const currentDatabase = await testPostgresConnection();

  if (!currentDatabase) {
    throw new Error("Database name could not be resolved.");
  }

  console.log(`Connected to PostgreSQL database: ${currentDatabase}`);

  if (currentDatabase !== "umarxonsdb") {
    console.warn(
      `Warning: expected "umarxonsdb" but connected to "${currentDatabase}".`,
    );
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Database check failed");
  process.exit(1);
});
