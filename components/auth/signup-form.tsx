"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { SetupAlert } from "@/components/auth/setup-alert";
import { signupAction } from "@/server/actions/auth";
import { signupSchema, type SignupInput } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SignupForm({
  setupMessage,
  missingKeys = [],
}: {
  setupMessage?: string | null;
  missingKeys?: string[];
}) {
  const [isPending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      const result = await signupAction(values);

      if (!result?.success) {
        if (result?.fieldErrors) {
          Object.entries(result.fieldErrors).forEach(([field, fieldError]) => {
            const message = fieldError?.[0];
            if (message) {
              setError(field as keyof SignupInput, { message });
            }
          });
        }

        toast.error(result?.error ?? "Ro'yxatdan o'tishda xatolik yuz berdi.");
      }
    });
  });

  return (
    <Card className="p-8">
      <h2 className="text-3xl font-semibold text-slate-950">Yangi workspace</h2>
      <p className="mt-2 text-sm text-slate-600">
        Bir necha daqiqada Telegram bot builder dashboardini ishga tushiring.
      </p>
      {setupMessage ? (
        <div className="mt-5">
          <SetupAlert message={setupMessage} missingKeys={missingKeys} />
        </div>
      ) : null}
      <form className="mt-8 space-y-5" onSubmit={onSubmit}>
        <div>
          <Label htmlFor="fullName">{"To'liq ism"}</Label>
          <Input id="fullName" {...register("fullName")} />
          {errors.fullName ? (
            <p className="mt-2 text-sm text-red-600">{errors.fullName.message}</p>
          ) : null}
        </div>
        <div>
          <Label htmlFor="workspaceName">Workspace nomi</Label>
          <Input id="workspaceName" {...register("workspaceName")} />
          {errors.workspaceName ? (
            <p className="mt-2 text-sm text-red-600">{errors.workspaceName.message}</p>
          ) : null}
        </div>
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
        <Button className="w-full" type="submit" disabled={isPending || Boolean(setupMessage)}>
          {isPending ? "Yaratilmoqda..." : "Workspace yaratish"}
        </Button>
      </form>
      <p className="mt-6 text-sm text-slate-600">
        Akkauntingiz bormi?{" "}
        <Link href="/login" className="font-semibold text-teal-700">
          Kirish
        </Link>
      </p>
    </Card>
  );
}
