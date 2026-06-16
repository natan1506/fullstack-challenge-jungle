import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "bg-purple-900 text-purple-300 border border-purple-700",
        pending: "bg-yellow-900 text-yellow-300 border border-yellow-700",
        won: "bg-green-900 text-green-300 border border-green-700",
        lost: "bg-red-900 text-red-300 border border-red-700",
        betting: "bg-blue-900 text-blue-300 border border-blue-700",
        running: "bg-purple-900 text-purple-300 border border-purple-700",
        crashed: "bg-red-900 text-red-300 border border-red-700",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
