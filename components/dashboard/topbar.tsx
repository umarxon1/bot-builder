import { LogOut } from "lucide-react";

import { signOutAction } from "@/server/actions/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function DashboardTopbar({
  workspaceName,
  userEmail,
}: {
  workspaceName: string;
  userEmail: string;
}) {
  return (
    <div className="surface-card flex flex-col gap-4 rounded-[28px] border border-white/80 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <Badge>{workspaceName}</Badge>
        <p className="mt-3 text-sm text-slate-600">{userEmail}</p>
      </div>
      <form action={signOutAction}>
        <Button type="submit" variant="secondary">
          <LogOut className="size-4" />
          Chiqish
        </Button>
      </form>
    </div>
  );
}
