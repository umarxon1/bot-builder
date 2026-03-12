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
    }),
  );
  const previewNode = builder.nodes.find((node) => node.is_start) ?? null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Flow builder"
        description="Structured menu/tree builder orqali node, button va start pointni boshqaring."
        actions={<PublishFlowButton flowId={builder.flow.id} botId={context.bot.id} />}
      />
      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-6">
          <CreateNodeForm flowId={builder.flow.id} nodeOptions={nodeOptions} />
          <BuilderPreview node={previewNode} published={builder.publishedFlowId === builder.flow.id} />
        </div>
        <div className="space-y-6">
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
