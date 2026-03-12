import Link from "next/link";

import { BuilderPreview } from "@/components/builder/builder-preview";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCompactNumber, formatRelative } from "@/lib/utils/format";
import { getBuilderPreview, getDashboardOverview } from "@/server/repositories/dashboard";
import { requireWorkspaceContext } from "@/server/repositories/context";

export default async function DashboardPage() {
  const context = await requireWorkspaceContext();
  const overview = await getDashboardOverview(context.workspace.id);
  const preview = context.bot ? await getBuilderPreview(context.workspace.id) : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Bugungi activity, yangi leadlar va so'nggi interactionlarni kuzating."
        actions={
          !context.bot ? (
            <Button asChild>
              <Link href="/dashboard/bot">Bot ulash</Link>
            </Button>
          ) : undefined
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total bot users"
          value={formatCompactNumber(overview.stats.totalBotUsers)}
          helper="Bot bilan muloqot qilgan foydalanuvchilar"
        />
        <StatCard
          label="Leads"
          value={formatCompactNumber(overview.stats.leadsCount)}
          helper="Lead capture node orqali yig'ilganlar"
        />
        <StatCard
          label="Orders"
          value={formatCompactNumber(overview.stats.ordersCount)}
          helper="Order form orqali kelgan buyurtmalar"
        />
        <StatCard
          label="Messages today"
          value={formatCompactNumber(overview.stats.messagesToday)}
          helper="Bugungi interaction logs soni"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-slate-950">Latest interactions</h2>
              <p className="mt-2 text-sm text-slate-600">
                {"Botdagi so'nggi foydalanuvchi harakatlari"}
              </p>
            </div>
            <Badge>{overview.latestInteractions.length} ta</Badge>
          </div>
          <div className="mt-6 grid gap-3">
            {overview.latestInteractions.length ? (
              overview.latestInteractions.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-slate-900">
                      {item.botUserName ?? "Telegram user"}
                    </p>
                    <span className="text-xs text-slate-500">{formatRelative(item.createdAt)}</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">
                    {item.eventType} / {item.direction}
                  </p>
                  {item.messageText ? (
                    <p className="mt-1 text-sm text-slate-700">{item.messageText}</p>
                  ) : null}
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">{"Interactionlar hali yo'q."}</p>
            )}
          </div>
        </Card>

        {context.bot ? (
          <BuilderPreview
            node={preview}
            published={Boolean(context.bot.published_flow_id)}
          />
        ) : (
          <EmptyState
            title="Bot hali ulanmagan"
            description="Dashboard preview va analytics ishlashi uchun avval Telegram bot tokenini ulang."
            action={
              <Button asChild>
                <Link href="/dashboard/bot">Bot ulash</Link>
              </Button>
            }
          />
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-slate-950">Latest leads</h2>
          <div className="mt-5 grid gap-3">
            {overview.latestLeads.length ? (
              overview.latestLeads.map((lead) => (
                <div
                  key={lead.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                >
                  <p className="font-medium text-slate-900">{lead.full_name}</p>
                  <p className="mt-1 text-sm text-slate-600">{lead.phone}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">{"Leadlar hali yo'q."}</p>
            )}
          </div>
        </Card>
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-slate-950">Latest orders</h2>
          <div className="mt-5 grid gap-3">
            {overview.latestOrders.length ? (
              overview.latestOrders.map((order) => (
                <div
                  key={order.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                >
                  <p className="font-medium text-slate-900">{order.product_name}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    {order.customer_name} / {order.status}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">{"Buyurtmalar hali yo'q."}</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
