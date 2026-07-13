import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type YearNavigationProps = {
  readonly year: number;
};

export function YearNavigation({ year }: YearNavigationProps) {
  return (
    <nav
      aria-label="Navegação por ano"
      className="flex items-center rounded-lg border border-border bg-panel p-1"
    >
      <Link
        aria-label={`Ver fluxo de caixa de ${year - 1}`}
        className={cn(buttonVariants({ size: "icon", variant: "ghost" }), "size-8")}
        href={`/analysis/cash-flow?year=${year - 1}`}
      >
        <ChevronLeft aria-hidden="true" />
      </Link>
      <span
        aria-current="date"
        className="min-w-20 px-3 text-center text-sm font-semibold tabular-nums"
      >
        {year}
      </span>
      <Link
        aria-label={`Ver fluxo de caixa de ${year + 1}`}
        className={cn(buttonVariants({ size: "icon", variant: "ghost" }), "size-8")}
        href={`/analysis/cash-flow?year=${year + 1}`}
      >
        <ChevronRight aria-hidden="true" />
      </Link>
    </nav>
  );
}
