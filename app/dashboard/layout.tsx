import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardTopbar } from "@/components/dashboard/topbar";
import { requireWorkspaceContext } from "@/server/repositories/context";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const context = await requireWorkspaceContext();

  return (
    <div className="mx-auto max-w-7xl px-6 py-6 lg:px-10">
      <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <DashboardSidebar />
        <div className="space-y-6">
          <DashboardTopbar
            workspaceName={context.workspace.name}
            userEmail={context.email}
          />
          {children}
        </div>
      </div>
    </div>
  );
}
