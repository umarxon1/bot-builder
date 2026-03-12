import { AuthHero } from "@/components/auth/auth-hero";
import { SignupForm } from "@/components/auth/signup-form";
import { getAuthSetupState } from "@/lib/setup-status";

export default function SignupPage() {
  const setupState = getAuthSetupState();

  return (
    <>
      <AuthHero />
      <SignupForm
        setupMessage={setupState.message}
        missingKeys={setupState.missingKeys}
      />
    </>
  );
}
