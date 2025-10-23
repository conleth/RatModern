import * as React from "react";

import { cn } from "../../lib/utils";

const badgeVariants = {
  default:
    "inline-flex items-center rounded-full border border-transparent bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  outline:
    "inline-flex items-center rounded-full border border-border px-3 py-1 text-xs font-semibold text-foreground"
};

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: keyof typeof badgeVariants;
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn("select-none", badgeVariants[variant], className)}
      {...props}
    />
  );
}

