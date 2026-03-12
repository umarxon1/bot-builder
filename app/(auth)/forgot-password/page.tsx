import { AuthHero } from "@/components/auth/auth-hero";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { getAuthSetupState } from "@/lib/setup-status";

export default function ForgotPasswordPage() {
  const setupState = getAuthSetupState();

  return (
    <>
      <AuthHero />
      <ForgotPasswordForm
        setupMessage={setupState.message}
        missingKeys={setupState.missingKeys}
      />
    </>
  );
}
