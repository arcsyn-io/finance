import type { EconomicEvent } from "@/domain/entry/entry";

export const consumptionEconomicEvent = "CONSUMPTION" satisfies EconomicEvent;

type ConsumptionEntryCandidate = {
  readonly categoryId: string | null;
  readonly economicEvent: EconomicEvent | null;
  readonly deletedAt: Date | null;
};

export function isConsumptionEntryForCategory(
  entry: ConsumptionEntryCandidate,
  categoryId: string,
): boolean {
  return (
    entry.deletedAt === null &&
    entry.economicEvent === consumptionEconomicEvent &&
    entry.categoryId === categoryId
  );
}

export function toExclusiveEndDate(inclusiveEndDate: string): string {
  const [year, month, day] = inclusiveEndDate.split("-").map(Number);
  const nextDay = new Date(Date.UTC(year, month - 1, day + 1));

  return [
    nextDay.getUTCFullYear(),
    String(nextDay.getUTCMonth() + 1).padStart(2, "0"),
    String(nextDay.getUTCDate()).padStart(2, "0"),
  ].join("-");
}
