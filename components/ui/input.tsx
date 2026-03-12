import type { InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none ring-0 transition placeholder:text-slate-400 focus:border-teal-400 focus:shadow-[0_0_0_4px_rgba(45,212,191,0.14)]",
        className,
      )}
      {...props}
    />
  );
}
