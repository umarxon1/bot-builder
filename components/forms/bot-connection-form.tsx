"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { activateWebhookAction, verifyBotTokenAction } from "@/server/actions/bot";
import { botTokenSchema, type BotTokenInput } from "@/lib/validations/bot";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function BotConnectionForm({
  botId,
  botUsername,
  connectionStatus,
  webhookUrl,
  tokenLastFour,
}: {
  botId?: string;
  botUsername?: string | null;
  connectionStatus?: string | null;
  webhookUrl?: string | null;
  tokenLastFour?: string | null;
}) {
  const [isPending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BotTokenInput>({
    resolver: zodResolver(botTokenSchema),
  });

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      const result = await verifyBotTokenAction(values);

      if (!result?.success) {
        toast.error(result?.error ?? "Bot token tasdiqlanmadi.");
        return;
      }

      reset();
      toast.success(
        result.data?.botUsername
          ? `@${result.data.botUsername} muvaffaqiyatli ulandi.`
          : result.message ?? "Bot muvaffaqiyatli ulandi.",
      );
    });
  });

  const handleActivateWebhook = () => {
    if (!botId) {
      return;
    }

    startTransition(async () => {
      const result = await activateWebhookAction({ botId });

      if (!result?.success) {
        toast.error(result?.error ?? "Webhook yoqilmadi.");
        return;
      }

      toast.success(result.message ?? "Webhook yoqildi.");
    });
  };

  return (
    <Card className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-950">Telegram bot ulash</h2>
          <p className="mt-2 text-sm text-slate-600">
            BotFather tokenini faqat server tomonda saqlaymiz.
          </p>
        </div>
        {connectionStatus ? <Badge>{connectionStatus}</Badge> : null}
      </div>

      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        <div>
          <Label htmlFor="token">Bot token</Label>
          <Input
            id="token"
            type="password"
            placeholder="123456:AA..."
            {...register("token")}
          />
          {errors.token ? <p className="mt-2 text-sm text-red-600">{errors.token.message}</p> : null}
          {tokenLastFour ? (
            <p className="mt-2 text-xs text-slate-500">
              Hozirgi server-side token oxiri: `...{tokenLastFour}`
            </p>
          ) : null}
        </div>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Tekshirilmoqda..." : "Tokenni tekshirish"}
        </Button>
      </form>

      {botId ? (
        <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-slate-900">
                {botUsername ? `@${botUsername}` : "Bot ulangan"}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Webhook holati: {connectionStatus ?? "pending"}
              </p>
              {webhookUrl ? (
                <p className="mt-2 break-all text-xs text-slate-500">{webhookUrl}</p>
              ) : null}
            </div>
            <Button
              type="button"
              variant="secondary"
              disabled={isPending}
              onClick={handleActivateWebhook}
            >
              {isPending ? "Yoqilmoqda..." : "Webhookni faollashtirish"}
            </Button>
          </div>
        </div>
      ) : null}
    </Card>
  );
}
