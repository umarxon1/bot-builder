"use server";

import { redirect } from "next/navigation";

import { getServerEnv } from "@/lib/env.server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
  signupSchema,
} from "@/lib/validations/auth";
import { provisionWorkspaceForUser } from "@/server/repositories/workspaces";
import { actionError, actionSuccess, type ActionResult } from "@/server/actions/types";

function buildFallbackWorkspaceName(email: string, fullName?: string | null) {
  if (fullName?.trim()) {
    return `${fullName.trim()} Workspace`;
  }

  const emailPrefix = email.split("@")[0]?.trim();
  return `${emailPrefix || "My"} Workspace`;
}

function formatSetupError(error: unknown) {
  const fallback =
    "Loyiha hali sozlanmagan. `.env.local` faylini `.env.example` asosida to'ldiring.";

  if (!(error instanceof Error)) {
    return fallback;
  }

  if (
    error.message.includes("fetch failed") ||
    error.message.includes("Failed to fetch") ||
    error.message.includes("Invalid URL")
  ) {
    return "Supabase bilan ulanishda xatolik yuz berdi. `NEXT_PUBLIC_SUPABASE_URL`, kalitlar va internet ulanishini tekshirib, keyin yana urinib ko'ring.";
  }

  if (
    error.message.includes("Missing or invalid server environment variables") ||
    error.message.includes("Missing or invalid public environment variables")
  ) {
    return fallback;
  }

  if (
    error.message.includes("Could not find the table") ||
    error.message.includes("schema cache") ||
    error.message.includes("relation") && error.message.includes("does not exist")
  ) {
    return "Supabase bazasi hali tayyor emas. `supabase/migrations/20260312132000_init_botbuilder_uz.sql` faylini Supabase SQL Editor ichida ishga tushiring, keyin yana urinib ko'ring.";
  }

  return error.message;
}

function formatAuthErrorMessage(message: string) {
  if (message.includes("Email not confirmed")) {
    return "Email hali tasdiqlanmagan. Pochta qutingizdagi tasdiqlash linkini bosing yoki Supabase Auth sozlamalarida email confirmation'ni o'chiring.";
  }

  return message;
}

export async function loginAction(
  input: unknown,
): Promise<ActionResult<undefined>> {
  const parsed = loginSchema.safeParse(input);

  if (!parsed.success) {
    return actionError("Formani tekshiring", parsed.error.flatten().fieldErrors);
  }

  let supabase;

  try {
    supabase = await createServerSupabaseClient();
  } catch (error) {
    return actionError(formatSetupError(error));
  }

  let data;
  let error;

  try {
    const result = await supabase.auth.signInWithPassword(parsed.data);
    data = result.data;
    error = result.error;
  } catch (signInError) {
    return actionError(formatSetupError(signInError));
  }

  if (error) {
    return actionError(formatAuthErrorMessage(error.message));
  }

  if (data.user) {
    try {
      await provisionWorkspaceForUser({
        userId: data.user.id,
        email: data.user.email ?? parsed.data.email,
        fullName:
          typeof data.user.user_metadata?.full_name === "string"
            ? data.user.user_metadata.full_name
            : parsed.data.email.split("@")[0],
        workspaceName: buildFallbackWorkspaceName(
          data.user.email ?? parsed.data.email,
          typeof data.user.user_metadata?.full_name === "string"
            ? data.user.user_metadata.full_name
            : null,
        ),
      });
    } catch (workspaceError) {
      return actionError(formatSetupError(workspaceError));
    }
  }

  redirect("/dashboard");
}

export async function signupAction(
  input: unknown,
): Promise<ActionResult<undefined>> {
  const parsed = signupSchema.safeParse(input);

  if (!parsed.success) {
    return actionError("Formani tekshiring", parsed.error.flatten().fieldErrors);
  }

  let env;
  let supabase;

  try {
    env = getServerEnv();
    supabase = await createServerSupabaseClient();
  } catch (error) {
    return actionError(formatSetupError(error));
  }

  let data;
  let error;

  try {
    const result = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        data: {
          full_name: parsed.data.fullName,
        },
        emailRedirectTo: `${env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/dashboard`,
      },
    });

    data = result.data;
    error = result.error;
  } catch (signUpError) {
    return actionError(formatSetupError(signUpError));
  }

  if (error || !data.user) {
    return actionError(
      error ? formatAuthErrorMessage(error.message) : "Ro'yxatdan o'tishda xatolik",
    );
  }

  try {
    await provisionWorkspaceForUser({
      userId: data.user.id,
      email: parsed.data.email,
      fullName: parsed.data.fullName,
      workspaceName: parsed.data.workspaceName,
    });
  } catch (error) {
    return actionError(
      `${formatSetupError(error)} Agar auth user allaqachon yaratilgan bo'lsa, migrationdan keyin login qilib kirishingiz mumkin.`,
    );
  }

  if (!data.session) {
    redirect(
      "/login?message=Emailingizga tasdiqlash xati yuborildi. Linkni bosib tasdiqlagandan keyin tizimga kiring.",
    );
  }

  redirect("/dashboard");
}

export async function requestPasswordResetAction(
  input: unknown,
): Promise<ActionResult<undefined>> {
  const parsed = forgotPasswordSchema.safeParse(input);

  if (!parsed.success) {
    return actionError("Formani tekshiring", parsed.error.flatten().fieldErrors);
  }

  let env;
  let supabase;

  try {
    env = getServerEnv();
    supabase = await createServerSupabaseClient();
  } catch (error) {
    return actionError(formatSetupError(error));
  }

  let error;

  try {
    const result = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: `${env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/reset-password`,
    });
    error = result.error;
  } catch (resetRequestError) {
    return actionError(formatSetupError(resetRequestError));
  }

  if (error) {
    return actionError(formatAuthErrorMessage(error.message));
  }

  return actionSuccess("Tiklash havolasi emailingizga yuborildi.");
}

export async function resetPasswordAction(
  input: unknown,
): Promise<ActionResult<undefined>> {
  const parsed = resetPasswordSchema.safeParse(input);

  if (!parsed.success) {
    return actionError("Formani tekshiring", parsed.error.flatten().fieldErrors);
  }

  let supabase;

  try {
    supabase = await createServerSupabaseClient();
  } catch (error) {
    return actionError(formatSetupError(error));
  }

  let error;

  try {
    const result = await supabase.auth.updateUser({
      password: parsed.data.password,
    });
    error = result.error;
  } catch (updatePasswordError) {
    return actionError(formatSetupError(updatePasswordError));
  }

  if (error) {
    return actionError(formatAuthErrorMessage(error.message));
  }

  try {
    await supabase.auth.signOut();
  } catch (signOutError) {
    return actionError(formatSetupError(signOutError));
  }
  redirect("/login?message=Parolingiz yangilandi.");
}

export async function signOutAction() {
  try {
    const supabase = await createServerSupabaseClient();
    await supabase.auth.signOut();
  } catch {
    return;
  }

  redirect("/login");
}
