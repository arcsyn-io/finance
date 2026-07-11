import type {
  EconomicEvent,
  EntryNature,
} from "../../domain/entry/entry";

export type ListEntriesCommand = {
  readonly startDate?: string;
  readonly endDate?: string;
  readonly walletIds?: readonly string[];
  readonly categoryIds?: readonly string[];
  readonly natures?: readonly EntryNature[];
  readonly economicEvents?: readonly EconomicEvent[];
  readonly includeDeleted: boolean;
};

export type CreateEntryCommand = {
  readonly walletId: string;
  readonly categoryId: string;
  readonly nature: EntryNature;
  readonly economicEvent?: EconomicEvent;
  readonly amountCents: number;
  readonly occurredOn: string;
  readonly description?: string;
};

export type UpdateEntryCommand = CreateEntryCommand & {
  readonly id: string;
};

export type DeleteEntryCommand = {
  readonly id: string;
};

export type RestoreEntryCommand = {
  readonly id: string;
};

export type UnlinkEntryTransferCommand = {
  readonly entryId: string;
};

export type LinkEntryTransferCommand =
  | {
      readonly mode: "existing";
      readonly sourceEntryId: string;
      readonly targetEntryId: string;
    }
  | {
      readonly mode: "create";
      readonly sourceEntryId: string;
      readonly walletId: string;
      readonly categoryId: string;
      readonly nature: EntryNature;
      readonly description?: string;
    };
