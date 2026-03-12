const REQUIRED_SERVER_ENV_KEYS = [
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "DATABASE_HOST",
  "DATABASE_USER",
  "DATABASE_PASSWORD",
  "DATABASE_URL",
  "TELEGRAM_WEBHOOK_BASE_URL",
  "TELEGRAM_ENCRYPTION_SECRET",
  "APP_ENCRYPTION_KEY",
] as const;

export function getMissingServerEnvKeys() {
  return REQUIRED_SERVER_ENV_KEYS.filter((key) => {
    const value = process.env[key];
    return !value || !value.trim();
  });
}

export function getAuthSetupState() {
  const missingKeys = getMissingServerEnvKeys();

  return {
    ready: missingKeys.length === 0,
    missingKeys,
    message:
      missingKeys.length === 0
        ? null
        : ".env.local hali to'ldirilmagan. Auth ishlashi uchun kerakli environment variablelarni kiriting.",
  };
}
