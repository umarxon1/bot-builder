"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import { updateWorkspaceAction } from "@/server/actions/settings";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z.object({
  name: z.string().min(2, "Workspace nomini kiriting."),
});

type WorkspaceSettingsInput = z.infer<typeof schema>;

export function WorkspaceSettingsForm({ name }: { name: string }) {
  const [isPending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<WorkspaceSettingsInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      name,
    },
  });

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      const result = await updateWorkspaceAction(values);

      if (!result?.success) {
        toast.error(result?.error ?? "Workspace yangilanmadi.");
        return;
      }

      toast.success(result.message ?? "Workspace yangilandi.");
    });
  });

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold text-slate-950">Workspace sozlamalari</h2>
      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        <div>
          <Label htmlFor="name">Workspace nomi</Label>
          <Input id="name" {...register("name")} />
          {errors.name ? <p className="mt-2 text-sm text-red-600">{errors.name.message}</p> : null}
        </div>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saqlanmoqda..." : "O'zgarishlarni saqlash"}
        </Button>
      </form>
    </Card>
  );
}
