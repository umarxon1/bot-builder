"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { SetupAlert } from "@/components/auth/setup-alert";
import { requestPasswordResetAction } from "@/server/actions/auth";
import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
} from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ForgotPasswordForm({
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
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      const result = await requestPasswordResetAction(values);

      if (!result?.success) {
        toast.error(result?.error ?? "Tiklash xati yuborilmadi.");
        return;
      }

      toast.success(result.message ?? "Tiklash havolasi yuborildi.");
    });
  });

  return (
    <Card className="p-8">
      <h2 className="text-3xl font-semibold text-slate-950">Parolni tiklash</h2>
      <p className="mt-2 text-sm text-slate-600">
        Emailingizga xavfsiz tiklash havolasini yuboramiz.
      </p>
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
        <Button className="w-full" type="submit" disabled={isPending || Boolean(setupMessage)}>
          {isPending ? "Yuborilmoqda..." : "Tiklash havolasini yuborish"}
        </Button>
      </form>
      <p className="mt-6 text-sm text-slate-600">
        <Link href="/login" className="font-semibold text-teal-700">
          Kirish sahifasiga qaytish
        </Link>
      </p>
    </Card>
  );
}
