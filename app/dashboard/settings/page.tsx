import { WorkspaceSettingsForm } from "@/components/forms/workspace-settings-form";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { requireWorkspaceContext } from "@/server/repositories/context";

export default async function SettingsPage() {
  const context = await requireWorkspaceContext();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description={"Workspace nomi va environment bilan bog'liq amaliy eslatmalar."}
      />
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <WorkspaceSettingsForm name={context.workspace.name} />
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-slate-950">Environment notes</h2>
          <div className="mt-5 space-y-3 text-sm leading-7 text-slate-600">
            <p>{"`DATABASE_NAME` qiymati `umarxonsdb` bo'lishi kerak."}</p>
            <p>Database credentials faqat server tomonda va scripts ichida ishlatiladi.</p>
            <p>Telegram token va Supabase service role kalitlari brauzerga chiqarilmaydi.</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
