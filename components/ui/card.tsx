import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "surface-card rounded-[28px] border border-white/70 shadow-[0_28px_80px_-48px_rgba(15,23,42,0.45)]",
        className,
      )}
      {...props}
    />
  );
}
