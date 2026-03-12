import type { SelectHTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-teal-400 focus:shadow-[0_0_0_4px_rgba(45,212,191,0.14)]",
        className,
      )}
      {...props}
    />
  );
}
