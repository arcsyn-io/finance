"use client";

import { useState } from "react";
import type { Category } from "@/domain/category/category";
import { CategoryConsumptionDialog } from "@/modules/consumption/components/CategoryConsumptionDialog";

type CategoryConsumptionTriggerProps = {
  readonly category: {
    readonly categoryId: string;
    readonly name: string;
    readonly color: string;
    readonly totalCents: number;
    readonly percentage: number;
  };
  readonly categories: readonly Category[];
  readonly startDate: string;
  readonly endDate: string;
};

export function CategoryConsumptionTrigger({
  category,
  categories,
  startDate,
  endDate,
}: CategoryConsumptionTriggerProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className="flex w-full min-w-48 items-center gap-3 rounded-md text-left outline-none transition hover:text-accent focus-visible:ring-1 focus-visible:ring-accent"
        onClick={() => setOpen(true)}
        type="button"
      >
        <span
          className="size-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: category.color }}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <span className="truncate text-xs font-medium">{category.name}</span>
            <span className="text-[10px] tabular-nums text-muted">
              {formatPercentage(category.percentage)}
            </span>
          </div>
          <div className="mt-1 h-1 overflow-hidden rounded-full bg-surface-elevated">
            <span
              className="block h-full rounded-full"
              style={{
                backgroundColor: category.color,
                width: `${category.percentage}%`,
              }}
            />
          </div>
        </div>
      </button>
      {open ? (
        <CategoryConsumptionDialog
          categories={categories}
          category={category}
          endDate={endDate}
          onClose={() => setOpen(false)}
          startDate={startDate}
        />
      ) : null}
    </>
  );
}

function formatPercentage(value: number): string {
  return `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(value)}%`;
}
