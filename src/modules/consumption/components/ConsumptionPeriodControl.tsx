"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import {
  PeriodFilter,
  type PeriodFilterPreset,
  type PeriodFilterRange,
} from "@/components/ui/PeriodFilter";

type ConsumptionPeriodControlProps = {
  readonly startDate: string;
  readonly endDate: string;
  readonly preset: PeriodFilterPreset;
};

export function ConsumptionPeriodControl({
  startDate,
  endDate,
  preset,
}: ConsumptionPeriodControlProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleChange(range: PeriodFilterRange) {
    const params = new URLSearchParams({
      startDate: range.startDate,
      endDate: range.endDate,
      preset: range.preset,
    });
    startTransition(() => {
      router.push(`/analysis/consumption?${params.toString()}`);
    });
  }

  return (
    <div aria-busy={pending} className="flex items-center gap-2">
      <PeriodFilter
        disabled={pending}
        initialEndDate={endDate}
        initialPreset={preset}
        initialStartDate={startDate}
        onChange={handleChange}
      />
      {pending ? (
        <span className="text-[10px] font-medium text-muted" role="status">
          Atualizando...
        </span>
      ) : null}
    </div>
  );
}
