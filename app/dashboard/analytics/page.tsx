import { ActivityChart } from "@/components/charts/activity-chart";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { formatRelative } from "@/lib/utils/format";
import { getAnalytics } from "@/server/repositories/analytics";
import { requireWorkspaceContext } from "@/server/repositories/context";

export default async function AnalyticsPage() {
  const context = await requireWorkspaceContext();
  const analytics = await getAnalytics(context.workspace.id);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="7 kunlik activity va so'nggi interactionlar orqali bot ishlashini baholang."
      />
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-slate-950">7-day activity</h2>
        <p className="mt-2 text-sm text-slate-600">
          Interaction logs asosida hisoblangan oddiy trend.
        </p>
        <div className="mt-6">
          <ActivityChart data={analytics.activity} />
        </div>
      </Card>
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-slate-950">Latest interactions</h2>
        <div className="mt-5 grid gap-3">
          {analytics.latestInteractions.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium text-slate-900">{item.botUserName ?? "Telegram user"}</p>
                <span className="text-xs text-slate-500">{formatRelative(item.createdAt)}</span>
              </div>
              <p className="mt-2 text-sm text-slate-600">
                {item.eventType} / {item.direction}
              </p>
              {item.messageText ? <p className="mt-1 text-sm text-slate-700">{item.messageText}</p> : null}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
