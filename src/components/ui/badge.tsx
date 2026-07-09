import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "border-border text-muted",
        success: "border-positive/40 bg-positive/10 text-emerald-100",
        warning: "border-warning/40 bg-warning/10 text-amber-100",
        destructive: "border-negative/40 bg-negative/10 text-red-100",
        asset: "border-asset/40 bg-asset/10 text-indigo-100",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
