import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => (
    <input
      className={cn(
        "flex h-10 w-full rounded-lg border border-border bg-surface/40 px-3 py-2.5 text-xs text-foreground outline-none transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-subtle focus-visible:ring-1 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
      ref={ref}
      type={type}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export { Input };
