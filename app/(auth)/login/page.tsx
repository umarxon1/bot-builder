import { AuthHero } from "@/components/auth/auth-hero";
import { LoginForm } from "@/components/auth/login-form";
import { getAuthSetupState } from "@/lib/setup-status";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const params = await searchParams;
  const setupState = getAuthSetupState();

  return (
    <>
      <AuthHero />
      <LoginForm
        message={params.message}
        setupMessage={setupState.message}
        missingKeys={setupState.missingKeys}
      />
    </>
  );
}
