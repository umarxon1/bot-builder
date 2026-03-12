import { Search } from "lucide-react";

import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { getLeads } from "@/server/repositories/leads";
import { requireWorkspaceContext } from "@/server/repositories/context";
import { formatDateTime } from "@/lib/utils/format";

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const context = await requireWorkspaceContext();
  const params = await searchParams;
  const leads = await getLeads(context.workspace.id, params.q);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leads"
        description="Lead capture node orqali yig'ilgan kontaktlarni qidiring va ko'ring."
      />
      <form className="relative max-w-md">
        <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-slate-400" />
        <Input name="q" defaultValue={params.q} className="pl-10" placeholder="Ism yoki telefon bo'yicha qidirish" />
      </form>
      {leads.length ? (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-5 py-4">Full name</th>
                  <th className="px-5 py-4">Phone</th>
                  <th className="px-5 py-4">Source</th>
                  <th className="px-5 py-4">Created</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => {
                  const botUser = Array.isArray(lead.bot_user) ? lead.bot_user[0] : lead.bot_user;

                  return (
                    <tr key={lead.id} className="border-t border-slate-100">
                      <td className="px-5 py-4 font-medium text-slate-900">{lead.full_name}</td>
                      <td className="px-5 py-4 text-slate-600">{lead.phone}</td>
                      <td className="px-5 py-4 text-slate-600">
                        {[botUser?.first_name, botUser?.last_name].filter(Boolean).join(" ") ||
                          botUser?.username ||
                          "-"}
                      </td>
                      <td className="px-5 py-4 text-slate-600">{formatDateTime(lead.created_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <EmptyState
          title="Leadlar hali yo'q"
          description="Lead capture node publish qilingandan keyin bu yerda yangi kontaktlar ko'rinadi."
        />
      )}
    </div>
  );
}
