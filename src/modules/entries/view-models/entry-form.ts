import type { EconomicEvent, EntryNature } from "@/domain/entry/entry";

export type EntryForm = {
  readonly walletId: string;
  readonly categoryId: string;
  readonly nature: EntryNature;
  readonly economicEvent: EconomicEvent | "";
  readonly amountCents: number;
  readonly occurredOn: string;
  readonly description: string;
};
