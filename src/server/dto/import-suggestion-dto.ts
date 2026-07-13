import type {
  EconomicEvent,
  EntryDirection,
  EntryNature,
} from "@/domain/entry/entry";
import type { ParsedImportRow } from "@/domain/import/import";

export type PrepareImportRowsInput = {
  readonly rows: readonly ParsedImportRow[];
  readonly defaultWalletId: string | null;
  readonly defaultCategoryId: string | null;
  readonly nature: EntryNature | null;
  readonly economicEvent: EconomicEvent | null;
};

export type ListImportSuggestionHistoryQuery = {
  readonly direction: EntryDirection;
  readonly walletId: string | null;
  readonly limit: number;
};
