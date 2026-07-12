"use client";

import { useRouter } from "next/navigation";
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

  function handleChange(range: PeriodFilterRange) {
    const params = new URLSearchParams({
      startDate: range.startDate,
      endDate: range.endDate,
      preset: range.preset,
    });
    router.push(`/analysis/consumption?${params.toString()}`);
  }

  return (
    <PeriodFilter
      initialEndDate={endDate}
      initialPreset={preset}
      initialStartDate={startDate}
      onChange={handleChange}
    />
  );
}
