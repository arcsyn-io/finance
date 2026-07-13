"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type YearNavigationProps = {
  readonly year: number;
};

export function YearNavigation({ year }: YearNavigationProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function navigate(nextYear: number) {
    startTransition(() => {
      router.push(`/analysis/cash-flow?year=${nextYear}`);
    });
  }

  return (
    <nav
      aria-label="Navegação por ano"
      aria-busy={pending}
      className="flex items-center rounded-lg border border-border bg-panel p-1"
    >
      <button
        aria-label={`Ver fluxo de caixa de ${year - 1}`}
        className={cn(buttonVariants({ size: "icon", variant: "ghost" }), "size-8")}
        disabled={pending}
        onClick={() => navigate(year - 1)}
        type="button"
      >
        <ChevronLeft aria-hidden="true" />
      </button>
      <span
        aria-current="date"
        className="min-w-20 px-3 text-center text-sm font-semibold tabular-nums"
      >
        {pending ? "Atualizando..." : year}
      </span>
      <button
        aria-label={`Ver fluxo de caixa de ${year + 1}`}
        className={cn(buttonVariants({ size: "icon", variant: "ghost" }), "size-8")}
        disabled={pending}
        onClick={() => navigate(year + 1)}
        type="button"
      >
        <ChevronRight aria-hidden="true" />
      </button>
    </nav>
  );
}
