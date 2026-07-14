import type {
  EconomicEvent,
  EntryNature,
} from "@/domain/entry/entry";
import type { ImportSource } from "@/domain/import/import";

export type CreateImportCommand = {
  readonly fileName: string;
  readonly fileContent: string;
  readonly fileSizeBytes: number;
  readonly source: ImportSource;
  readonly defaultWalletId: string | null;
  readonly defaultCategoryId: string | null;
  readonly nature: EntryNature | null;
  readonly economicEvent: EconomicEvent | null;
};

export type ListImportsCommand = {
  readonly includeConfirmed: boolean;
};

export type UpdateImportRowCommand = {
  readonly importRequestId: string;
  readonly rowId: string;
  readonly description: string;
  readonly occurredOn: string;
  readonly amountCents: number;
  readonly walletId: string | null;
  readonly categoryId: string | null;
  readonly nature: EntryNature | null;
  readonly economicEvent: EconomicEvent | null;
};

export type BulkUpdateImportRowsPatch = Partial<
  Pick<
    UpdateImportRowCommand,
    "walletId" | "categoryId" | "nature" | "economicEvent"
  >
>;

export type BulkUpdateImportRowsCommand = {
  readonly importRequestId: string;
  readonly rowIds: readonly string[];
  readonly patch: BulkUpdateImportRowsPatch;
};

export type SetImportRowIgnoredCommand = {
  readonly importRequestId: string;
  readonly rowId: string;
  readonly ignored: boolean;
};

export type DeleteImportRowCommand = {
  readonly importRequestId: string;
  readonly rowId: string;
};

export type DeleteImportsCommand = {
  readonly ids: readonly string[];
};

export type ConfirmImportCommand = {
  readonly id: string;
};
