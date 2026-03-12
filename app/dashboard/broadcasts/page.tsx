import Link from "next/link";

import { PageHeader } from "@/components/dashboard/page-header";
import { BroadcastForm } from "@/components/forms/broadcast-form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDateTime } from "@/lib/utils/format";
import { getBroadcastAudience, getBroadcastHistory } from "@/server/repositories/broadcasts";
import { requireWorkspaceContext } from "@/server/repositories/context";

export default async function BroadcastsPage() {
  const context = await requireWorkspaceContext();

  if (!context.bot) {
    return (
      <EmptyState
        title="Broadcast uchun bot kerak"
        description="Bot ulanmaguncha audience yig'ilmaydi va broadcast yuborib bo'lmaydi."
        action={
          <Button asChild>
            <Link href="/dashboard/bot">Bot ulash</Link>
          </Button>
        }
      />
    );
  }

  const [history, audience] = await Promise.all([
    getBroadcastHistory(context.workspace.id),
    getBroadcastAudience(context.workspace.id, context.bot.id),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Broadcasts"
        description="Audience preview, confirm send va delivery history bilan ommaviy xabar yuboring."
      />
      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <BroadcastForm defaultAudience={audience.count} />
        <Card className="p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-slate-950">Broadcast history</h2>
            <span className="text-sm text-slate-500">Audience: {audience.count}</span>
          </div>
          <div className="mt-6 grid gap-3">
            {history.length ? (
              history.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-slate-900">{item.title}</p>
                    <span className="text-xs text-slate-500">{item.status}</span>
                  </div>
                  <p className="mt-2 line-clamp-3 text-sm text-slate-600">{item.message}</p>
                  <p className="mt-2 text-xs text-slate-500">
                    Preview {item.preview_recipient_count} / sent {item.sent_count} / failed{" "}
                    {item.failed_count} / {formatDateTime(item.created_at)}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">{"Broadcast history hali bo'sh."}</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
