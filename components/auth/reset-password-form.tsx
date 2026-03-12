"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { resetPasswordAction } from "@/server/actions/auth";
import { resetPasswordSchema, type ResetPasswordInput } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ResetPasswordForm() {
  const [isPending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      const result = await resetPasswordAction(values);
      if (result && !result.success) {
        toast.error(result.error);
      }
    });
  });

  return (
    <Card className="mx-auto w-full max-w-lg p-8">
      <h1 className="text-3xl font-semibold text-slate-950">Yangi parol</h1>
      <p className="mt-2 text-sm text-slate-600">
        Akkaunt xavfsizligi uchun yangi parol kiriting.
      </p>
      <form className="mt-8 space-y-5" onSubmit={onSubmit}>
        <div>
          <Label htmlFor="password">Yangi parol</Label>
          <Input id="password" type="password" {...register("password")} />
          {errors.password ? (
            <p className="mt-2 text-sm text-red-600">{errors.password.message}</p>
          ) : null}
        </div>
        <div>
          <Label htmlFor="confirmPassword">Parolni tasdiqlang</Label>
          <Input id="confirmPassword" type="password" {...register("confirmPassword")} />
          {errors.confirmPassword ? (
            <p className="mt-2 text-sm text-red-600">{errors.confirmPassword.message}</p>
          ) : null}
        </div>
        <Button className="w-full" type="submit" disabled={isPending}>
          {isPending ? "Saqlanmoqda..." : "Parolni yangilash"}
        </Button>
      </form>
    </Card>
  );
}
