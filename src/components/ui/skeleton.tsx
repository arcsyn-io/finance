import { cn } from "@/lib/utils";

type SkeletonProps = {
  readonly className?: string;
};

export function Skeleton({ className }: SkeletonProps) {
  return (
    <span
      aria-hidden="true"
      className={cn("block animate-pulse rounded-md bg-surface-elevated", className)}
    />
  );
}
