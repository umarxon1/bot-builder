"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { createNodeAction } from "@/server/actions/builder";
import type { CreateNodeInput } from "@/lib/validations/builder";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export function CreateNodeForm({
  flowId,
  nodeOptions,
}: {
  flowId: string;
  nodeOptions: Array<{ id: string; title: string }>;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateNodeInput>({
    defaultValues: {
      flowId,
      title: "",
      type: "message",
      content: "",
      isStart: false,
      nextNodeId: "",
      successMessage: "",
      productName: "",
      url: "",
      buttonLabel: "",
    },
  });

  const nodeType = watch("type");

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      const result = await createNodeAction(values);

      if (!result?.success) {
        toast.error(result?.error ?? "Node yaratilmadi.");
        return;
      }

      toast.success(result.message ?? "Node yaratildi.");
      router.refresh();
      reset({
        flowId,
        title: "",
        type: "message",
        content: "",
        isStart: false,
        nextNodeId: "",
        successMessage: "",
        productName: "",
        url: "",
        buttonLabel: "",
      });
    });
  });

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold text-slate-950">Yangi node</h2>
      <form className="mt-6 grid gap-4" onSubmit={onSubmit}>
        <input type="hidden" value={flowId} {...register("flowId")} />
        <div>
          <Label htmlFor="title">Node nomi</Label>
          <Input id="title" {...register("title")} />
          {errors.title ? (
            <p className="mt-2 text-sm text-red-600">{errors.title.message}</p>
          ) : null}
        </div>
        <div>
          <Label htmlFor="type">Node turi</Label>
          <Select id="type" {...register("type")}>
            <option value="message">Message</option>
            <option value="menu">Menu</option>
            <option value="lead_capture">Lead capture</option>
            <option value="order_form">Order form</option>
            <option value="external_link">External link</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="content">Kontent</Label>
          <Textarea id="content" {...register("content")} />
          {errors.content ? (
            <p className="mt-2 text-sm text-red-600">{errors.content.message}</p>
          ) : null}
        </div>
        <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
          <input type="checkbox" {...register("isStart")} />
          Start node sifatida belgilash
        </label>
        {nodeType === "message" || nodeType === "external_link" ? (
          <div>
            <Label htmlFor="nextNodeId">Keyingi node</Label>
            <Select id="nextNodeId" {...register("nextNodeId")}>
              <option value="">Tanlanmagan</option>
              {nodeOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.title}
                </option>
              ))}
            </Select>
          </div>
        ) : null}
        {nodeType === "lead_capture" || nodeType === "order_form" ? (
          <div>
            <Label htmlFor="successMessage">Success message</Label>
            <Input id="successMessage" {...register("successMessage")} />
          </div>
        ) : null}
        {nodeType === "order_form" ? (
          <div>
            <Label htmlFor="productName">Product/service nomi</Label>
            <Input id="productName" {...register("productName")} />
          </div>
        ) : null}
        {nodeType === "external_link" ? (
          <>
            <div>
              <Label htmlFor="url">External URL</Label>
              <Input id="url" placeholder="https://..." {...register("url")} />
            </div>
            <div>
              <Label htmlFor="buttonLabel">Button label</Label>
              <Input id="buttonLabel" {...register("buttonLabel")} />
            </div>
          </>
        ) : null}
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saqlanmoqda..." : "Node yaratish"}
        </Button>
      </form>
    </Card>
  );
}
