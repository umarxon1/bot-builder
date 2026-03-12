import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-teal-100 bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800",
        className,
      )}
      {...props}
    />
  );
}
