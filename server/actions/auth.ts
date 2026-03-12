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

function formatSetupError(error: unknown) {
  const fallback =
    "Loyiha hali sozlanmagan. `.env.local` faylini `.env.example` asosida to'ldiring.";

  if (!(error instanceof Error)) {
    return fallback;
  }

  if (
    error.message.includes("Missing or invalid server environment variables") ||
    error.message.includes("Missing or invalid public environment variables")
  ) {
    return fallback;
  }

  return error.message;
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

  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return actionError(error.message);
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

  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        full_name: parsed.data.fullName,
      },
      emailRedirectTo: `${env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/dashboard`,
    },
  });

  if (error || !data.user) {
    return actionError(error?.message ?? "Ro'yxatdan o'tishda xatolik");
  }

  try {
    await provisionWorkspaceForUser({
      userId: data.user.id,
      email: parsed.data.email,
      fullName: parsed.data.fullName,
      workspaceName: parsed.data.workspaceName,
    });
  } catch (error) {
    return actionError(formatSetupError(error));
  }

  if (!data.session) {
    redirect("/login?message=Email tasdiqlangandan keyin tizimga kiring.");
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

  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/reset-password`,
  });

  if (error) {
    return actionError(error.message);
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

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return actionError(error.message);
  }

  await supabase.auth.signOut();
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
