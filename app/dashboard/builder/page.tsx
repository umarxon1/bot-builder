import Link from "next/link";

import { BuilderPreview } from "@/components/builder/builder-preview";
import { CreateNodeForm } from "@/components/builder/create-node-form";
import { NodeCard } from "@/components/builder/node-card";
import { PublishFlowButton } from "@/components/builder/publish-flow-button";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { getBuilderData, getNodeOptions } from "@/server/repositories/builder";
import { requireWorkspaceContext } from "@/server/repositories/context";

export const dynamic = "force-dynamic";

export default async function BuilderPage() {
  const context = await requireWorkspaceContext();

  if (!context.bot) {
    return (
      <EmptyState
        title="Builder uchun bot kerak"
        description="Flow builder ishlashi uchun avval Telegram botni ulang va verify qiling."
        action={
          <Button asChild>
            <Link href="/dashboard/bot">{"Bot sahifasiga o'tish"}</Link>
          </Button>
        }
      />
    );
  }

  const builder = await getBuilderData(context.workspace.id, context.bot.id);
  const nodeOptions = (await getNodeOptions(context.workspace.id, builder.flow.id)).map(
    (option) => ({
      id: option.id,
      title: option.title,
      label: `${option.title} (${option.type}${option.is_start ? ", start" : ""})`,
    }),
  );
  const previewNode = builder.nodes.find((node) => node.is_start) ?? null;
  const nodeCount = builder.nodes.length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Flow builder"
        description="Structured menu/tree builder orqali node, button va start pointni boshqaring."
        actions={<PublishFlowButton flowId={builder.flow.id} botId={context.bot.id} />}
      />
      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white/70 px-5 py-4 text-sm text-slate-600">
            {"Yangi node yaratgandan keyin ro'yxat \"Node list\" bo'limida ko'rinadi. Kichik ekranda bu bo'lim pastda joylashadi."}
          </div>
          <CreateNodeForm flowId={builder.flow.id} nodeOptions={nodeOptions} />
          <BuilderPreview node={previewNode} published={builder.publishedFlowId === builder.flow.id} />
        </div>
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white/80 px-5 py-4">
            <h2 className="text-lg font-semibold text-slate-950">Node list</h2>
            <p className="mt-1 text-sm text-slate-600">{nodeCount} ta node topildi.</p>
          </div>
          {builder.nodes.map((node) => (
            <NodeCard
              key={node.id}
              node={node}
              flowId={builder.flow.id}
              nodeOptions={nodeOptions}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
