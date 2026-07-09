import * as React from "react";
import { cn } from "@/lib/utils";

const Select = React.forwardRef<
  HTMLSelectElement,
  React.ComponentProps<"select">
>(({ className, ...props }, ref) => (
  <select
    className={cn(
      "flex h-10 w-full rounded-md border border-border bg-surface/60 px-3 py-2 text-xs text-foreground outline-none transition focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/20 disabled:cursor-not-allowed disabled:opacity-60",
      className,
    )}
    ref={ref}
    {...props}
  />
));
Select.displayName = "Select";

export { Select };
