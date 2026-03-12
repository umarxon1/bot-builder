"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import {
  previewBroadcastAction,
  sendBroadcastAction,
} from "@/server/actions/broadcasts";
import { previewBroadcastSchema, type PreviewBroadcastInput } from "@/lib/validations/broadcast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function BroadcastForm({ defaultAudience }: { defaultAudience: number }) {
  const [isPending, startTransition] = useTransition();
  const [previewCount, setPreviewCount] = useState<number | null>(defaultAudience || null);
  const [confirmSend, setConfirmSend] = useState(false);
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<PreviewBroadcastInput>({
    resolver: zodResolver(previewBroadcastSchema),
  });

  const handlePreview = handleSubmit((values) => {
    startTransition(async () => {
      const result = await previewBroadcastAction(values);

      if (!result?.success) {
        toast.error(result?.error ?? "Preview tayyorlanmadi.");
        return;
      }

      setPreviewCount(result.data?.recipientCount ?? 0);
      toast.success(result.message ?? "Preview tayyor.");
    });
  });

  const handleSend = () => {
    const values = getValues();
    startTransition(async () => {
      const result = await sendBroadcastAction({
        ...values,
        confirmSend,
      });

      if (!result?.success) {
        toast.error(result?.error ?? "Broadcast yuborilmadi.");
        return;
      }

      toast.success(
        `Yuborildi: ${result.data?.sentCount ?? 0}, xatolik: ${result.data?.failedCount ?? 0}`,
      );
      setConfirmSend(false);
    });
  };

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold text-slate-950">Yangi broadcast</h2>
      <p className="mt-2 text-sm text-slate-600">
        {"Oldin preview qiling, so'ng confirm bilan batch-based yuboring."}
      </p>
      <form className="mt-6 space-y-4" onSubmit={handlePreview}>
        <div>
          <Label htmlFor="title">Sarlavha</Label>
          <Input id="title" {...register("title")} />
          {errors.title ? <p className="mt-2 text-sm text-red-600">{errors.title.message}</p> : null}
        </div>
        <div>
          <Label htmlFor="message">Xabar matni</Label>
          <Textarea id="message" {...register("message")} />
          {errors.message ? (
            <p className="mt-2 text-sm text-red-600">{errors.message.message}</p>
          ) : null}
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          Preview audience: <span className="font-semibold">{previewCount ?? 0}</span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" variant="secondary" disabled={isPending}>
            {isPending ? "Hisoblanmoqda..." : "Preview"}
          </Button>
          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm">
            <input
              type="checkbox"
              checked={confirmSend}
              onChange={(event) => setConfirmSend(event.target.checked)}
            />
            Yuborishni tasdiqlayman
          </label>
          <Button type="button" onClick={handleSend} disabled={isPending || !confirmSend}>
            {isPending ? "Yuborilmoqda..." : "Broadcast yuborish"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
