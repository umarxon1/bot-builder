const REQUIRED_AUTH_ENV_KEYS = [
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
] as const;

export function getMissingAuthEnvKeys() {
  return REQUIRED_AUTH_ENV_KEYS.filter((key) => {
    const value = process.env[key];
    return !value || !value.trim();
  });
}

export function getAuthSetupState() {
  const missingKeys = getMissingAuthEnvKeys();

  return {
    ready: missingKeys.length === 0,
    missingKeys,
    message:
      missingKeys.length === 0
        ? null
        : "Auth ishlashi uchun kerakli environment variablelar hali kiritilmagan.",
  };
}
