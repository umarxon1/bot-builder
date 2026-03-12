"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { BarChart3, Bot, Megaphone, Package, Settings, Users, Workflow } from "lucide-react";

import { cn } from "@/lib/utils/cn";

const navigation = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/dashboard/bot", label: "Bot", icon: Bot },
  { href: "/dashboard/builder", label: "Builder", icon: Workflow },
  { href: "/dashboard/leads", label: "Leads", icon: Users },
  { href: "/dashboard/orders", label: "Orders", icon: Package },
  { href: "/dashboard/broadcasts", label: "Broadcasts", icon: Megaphone },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
] as const satisfies ReadonlyArray<{
  href: Route;
  label: string;
  icon: typeof BarChart3;
}>;

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="surface-card sticky top-6 h-fit rounded-[28px] border border-white/80 p-5">
      <div className="mb-6 border-b border-slate-200 pb-5">
        <p className="font-semibold tracking-[0.16em] text-teal-700 uppercase">
          BotBuilder Uz
        </p>
        <p className="mt-2 text-sm text-slate-500">Telegram bot SaaS dashboard</p>
      </div>
      <nav className="grid gap-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition",
                isActive
                  ? "bg-teal-700 text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
              )}
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
