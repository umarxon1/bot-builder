"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { loginAction } from "@/server/actions/auth";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { SetupAlert } from "@/components/auth/setup-alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm({
  message,
  setupMessage,
  missingKeys = [],
}: {
  message?: string;
  setupMessage?: string | null;
  missingKeys?: string[];
}) {
  const [isPending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      const result = await loginAction(values);

      if (!result?.success) {
        if (result?.fieldErrors) {
          Object.entries(result.fieldErrors).forEach(([field, fieldError]) => {
            const message = fieldError?.[0];
            if (message) {
              setError(field as keyof LoginInput, { message });
            }
          });
        }

        toast.error(result?.error ?? "Kirishda xatolik yuz berdi.");
      }
    });
  });

  return (
    <Card className="p-8">
      <h2 className="text-3xl font-semibold text-slate-950">Kirish</h2>
      <p className="mt-2 text-sm text-slate-600">
        Workspace dashboardingizga email va parol bilan kiring.
      </p>
      {message ? (
        <div className="mt-5 rounded-2xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-900">
          {message}
        </div>
      ) : null}
      {setupMessage ? (
        <div className="mt-5">
          <SetupAlert message={setupMessage} missingKeys={missingKeys} />
        </div>
      ) : null}
      <form className="mt-8 space-y-5" onSubmit={onSubmit}>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" {...register("email")} />
          {errors.email ? <p className="mt-2 text-sm text-red-600">{errors.email.message}</p> : null}
        </div>
        <div>
          <Label htmlFor="password">Parol</Label>
          <Input id="password" type="password" {...register("password")} />
          {errors.password ? (
            <p className="mt-2 text-sm text-red-600">{errors.password.message}</p>
          ) : null}
        </div>
        <div className="flex items-center justify-between gap-3">
          <Link href="/forgot-password" className="text-sm font-medium text-teal-700">
            Parolni unutdingizmi?
          </Link>
          <Button type="submit" disabled={isPending || Boolean(setupMessage)}>
            {isPending ? "Kirilmoqda..." : "Kirish"}
          </Button>
        </div>
      </form>
      <p className="mt-6 text-sm text-slate-600">
        {"Akkauntingiz yo'qmi? "}
        <Link href="/signup" className="font-semibold text-teal-700">
          {"Ro'yxatdan o'ting"}
        </Link>
      </p>
    </Card>
  );
}
