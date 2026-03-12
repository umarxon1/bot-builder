"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import {
  deleteButtonAction,
  saveButtonAction,
  updateNodeAction,
} from "@/server/actions/builder";
import type { ButtonInput, UpdateNodeInput } from "@/lib/validations/builder";
import type { FlowNodeWithButtons } from "@/types/app";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

function ButtonCreateForm({
  nodeId,
  nodeOptions,
}: {
  nodeId: string;
  nodeOptions: Array<{ id: string; title: string; label?: string }>;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const availableNodeOptions = nodeOptions.filter((option) => option.id !== nodeId);
  const { register, handleSubmit, watch, reset } = useForm<ButtonInput>({
    defaultValues: {
      nodeId,
      kind: "navigate",
      label: "",
      targetNodeId: "",
      url: "",
    },
  });
  const kind = watch("kind");

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      const result = await saveButtonAction(values);

      if (!result?.success) {
        toast.error(result?.error ?? "Button saqlanmadi.");
        return;
      }

      toast.success(result.message ?? "Button saqlandi.");
      router.refresh();
      reset({ nodeId, kind: "navigate", label: "", targetNodeId: "", url: "" });
    });
  });

  return (
    <form className="mt-4 grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4" onSubmit={onSubmit}>
      <input type="hidden" value={nodeId} {...register("nodeId")} />
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label>Button matni</Label>
          <Input {...register("label")} />
        </div>
        <div>
          <Label>Turi</Label>
          <Select {...register("kind")}>
            <option value="navigate">Navigate</option>
            <option value="url">URL</option>
          </Select>
        </div>
      </div>
      {kind === "navigate" ? (
        <div>
          <Label>Target node</Label>
          <Select {...register("targetNodeId")}>
            <option value="">Tanlang</option>
            {availableNodeOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label ?? option.title}
              </option>
            ))}
          </Select>
        </div>
      ) : (
        <div>
          <Label>URL</Label>
          <Input placeholder="https://..." {...register("url")} />
        </div>
      )}
      <Button type="submit" variant="secondary" disabled={isPending}>
        {isPending ? "Qo'shilmoqda..." : "Button qo'shish"}
      </Button>
    </form>
  );
}

export function NodeCard({
  node,
  flowId,
  nodeOptions,
}: {
  node: FlowNodeWithButtons;
  flowId: string;
  nodeOptions: Array<{ id: string; title: string; label?: string }>;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<UpdateNodeInput>({
    defaultValues: {
      nodeId: node.id,
      flowId,
      title: node.title,
      type: node.type,
      content: node.content,
      isStart: node.is_start,
      nextNodeId: node.parsedConfig.nextNodeId ?? "",
      successMessage: node.parsedConfig.successMessage ?? "",
      productName: node.parsedConfig.productName ?? "",
      url: node.parsedConfig.url ?? "",
      buttonLabel: node.parsedConfig.buttonLabel ?? "",
    },
  });

  const nodeType = watch("type");

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      const result = await updateNodeAction(values);

      if (!result?.success) {
        toast.error(result?.error ?? "Node yangilanmadi.");
        return;
      }

      toast.success(result.message ?? "Node yangilandi.");
      router.refresh();
    });
  });

  const handleDeleteButton = (buttonId: string) => {
    startTransition(async () => {
      const result = await deleteButtonAction({ buttonId });

      if (!result?.success) {
        toast.error(result?.error ?? "Button o'chirilmadi.");
        return;
      }

      toast.success(result.message ?? "Button o'chirildi.");
      router.refresh();
    });
  };

  return (
    <Card className="p-6">
      <div className="flex flex-wrap items-center gap-3">
        <h3 className="text-xl font-semibold text-slate-950">{node.title}</h3>
        <Badge>{node.type}</Badge>
        {node.is_start ? <Badge className="bg-amber-50 text-amber-800">start</Badge> : null}
      </div>
      <form className="mt-5 grid gap-4" onSubmit={onSubmit}>
        <input type="hidden" value={node.id} {...register("nodeId")} />
        <input type="hidden" value={flowId} {...register("flowId")} />
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Node nomi</Label>
            <Input {...register("title")} />
            {errors.title ? <p className="mt-2 text-sm text-red-600">{errors.title.message}</p> : null}
          </div>
          <div>
            <Label>Node turi</Label>
            <Select {...register("type")}>
              <option value="message">Message</option>
              <option value="menu">Menu</option>
              <option value="lead_capture">Lead capture</option>
              <option value="order_form">Order form</option>
              <option value="external_link">External link</option>
            </Select>
          </div>
        </div>
        <div>
          <Label>Kontent</Label>
          <Textarea {...register("content")} />
        </div>
        <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
          <input type="checkbox" {...register("isStart")} />
          Start node
        </label>
        {nodeType === "message" || nodeType === "external_link" ? (
          <div>
            <Label>Keyingi node</Label>
            <Select {...register("nextNodeId")}>
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
            <Label>Success message</Label>
            <Input {...register("successMessage")} />
          </div>
        ) : null}
        {nodeType === "order_form" ? (
          <div>
            <Label>Product/service nomi</Label>
            <Input {...register("productName")} />
          </div>
        ) : null}
        {nodeType === "external_link" ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>URL</Label>
              <Input {...register("url")} />
            </div>
            <div>
              <Label>Button label</Label>
              <Input {...register("buttonLabel")} />
            </div>
          </div>
        ) : null}
        <Button type="submit" disabled={isPending}>
          {isPending ? "Yangilanmoqda..." : "Node yangilash"}
        </Button>
      </form>

      <div className="mt-6 rounded-3xl border border-slate-200 bg-white/80 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h4 className="font-semibold text-slate-900">Buttons</h4>
            <p className="text-sm text-slate-600">Mavjud navigatsiya variantlari</p>
          </div>
          <Badge>{node.buttons.length} ta</Badge>
        </div>
        <div className="mt-4 grid gap-2">
          {node.buttons.length ? (
            node.buttons.map((button) => (
              <div
                key={button.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
              >
                <div>
                  <span className="font-medium">{button.label}</span>
                  <span className="ml-2 text-slate-500">
                    {button.kind === "navigate"
                      ? `-> ${nodeOptions.find((option) => option.id === button.target_node_id)?.label ?? "target yo'q"}`
                      : button.url}
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={isPending}
                  onClick={() => handleDeleteButton(button.id)}
                >
                  {"O'chirish"}
                </Button>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500">{"Buttonlar hali qo'shilmagan."}</p>
          )}
        </div>
        {nodeType === "menu" ? (
          <ButtonCreateForm nodeId={node.id} nodeOptions={nodeOptions} />
        ) : (
          <p className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
            {"Button qo'shish uchun avval `Node turi` ni `Menu` ga o'zgartirib, `Node yangilash` ni bosing."}
          </p>
        )}
      </div>
    </Card>
  );
}
