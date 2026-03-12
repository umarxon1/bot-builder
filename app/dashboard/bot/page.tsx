import { BotConnectionForm } from "@/components/forms/bot-connection-form";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { getBotConnectionSummary } from "@/server/repositories/bots";
import { requireWorkspaceContext } from "@/server/repositories/context";

export default async function BotPage() {
  const context = await requireWorkspaceContext();
  const botSummary = await getBotConnectionSummary(context.workspace.id);
  const connection = Array.isArray(botSummary?.connection)
    ? botSummary.connection[0]
    : botSummary?.connection;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bot connection"
        description="BotFather tokenini tekshiring, metadata oling va webhookni yoqing."
      />
      <div className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
        <BotConnectionForm
          botId={botSummary?.id}
          botUsername={botSummary?.telegram_username}
          connectionStatus={connection?.status}
          webhookUrl={connection?.webhook_url}
          tokenLastFour={connection?.token_last_four}
        />
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-slate-950">Connection status</h2>
          <div className="mt-5 grid gap-3 text-sm text-slate-600">
            <p>Bot name: {botSummary?.name ?? "Ulanmagan"}</p>
            <p>Telegram username: {botSummary?.telegram_username ? `@${botSummary.telegram_username}` : "-"}</p>
            <p>Bot status: {botSummary?.status ?? "draft"}</p>
            <p>Webhook status: {connection?.status ?? "pending"}</p>
            <p>Verified at: {botSummary?.verified_at ?? "-"}</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
