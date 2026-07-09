import * as React from "react";
import { cn } from "@/lib/utils";

const Label = React.forwardRef<HTMLLabelElement, React.ComponentProps<"label">>(
  ({ className, ...props }, ref) => (
    <label
      className={cn("text-xs font-medium leading-none text-muted", className)}
      ref={ref}
      {...props}
    />
  ),
);
Label.displayName = "Label";

export { Label };
