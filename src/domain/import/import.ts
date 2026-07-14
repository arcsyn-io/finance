import type {
  EconomicEvent,
  EntryDirection,
  EntryNature,
} from "@/domain/entry/entry";

export const importStatuses = [
  "PENDING",
  "PENDING_REVIEW",
  "CONFIRMED",
  "CANCELLED",
] as const;

export const importSources = [
  "NUBANK_CSV",
  "NU_CONTA_CSV",
] as const;

export type ImportStatus = (typeof importStatuses)[number];
export type ImportSource = (typeof importSources)[number];

export type ImportRowStatus = "pending" | "ready" | "ignored";

export type ImportRequest = {
  readonly id: string;
  readonly userId: string;
  readonly source: ImportSource;
  readonly status: ImportStatus;
  readonly fileName: string;
  readonly nature: EntryNature | null;
  readonly economicEvent: EconomicEvent | null;
  readonly confirmedAt: Date | null;
  readonly defaultWalletId: string | null;
  readonly defaultWalletName: string | null;
  readonly defaultCategoryId: string | null;
  readonly defaultCategoryName: string | null;
  readonly attachmentCount: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly rows: readonly ImportRow[];
};

export type ImportRequestSummary = {
  readonly id: string;
  readonly source: ImportSource;
  readonly status: ImportStatus;
  readonly fileName: string;
  readonly createdAt: Date;
  readonly totalRows: number;
  readonly pendingRows: number;
  readonly ignoredRows: number;
};

export type ImportRow = {
  readonly id: string;
  readonly importRequestId: string;
  readonly userId: string;
  readonly rowNumber: number;
  readonly occurredOn: string;
  readonly description: string | null;
  readonly amountCents: number;
  readonly direction: EntryDirection;
  readonly nature: EntryNature | null;
  readonly walletId: string | null;
  readonly walletName: string | null;
  readonly categoryId: string | null;
  readonly categoryName: string | null;
  readonly categoryColor: string | null;
  readonly categoryIcon: string | null;
  readonly externalId: string | null;
  readonly valid: boolean;
  readonly validationErrors: string | null;
  readonly economicEvent: EconomicEvent | null;
  readonly entryId: string | null;
  readonly ignoredAt: Date | null;
  readonly attachmentCount: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

export type ParsedImportRow = {
  readonly rowNumber: number;
  readonly occurredOn: string;
  readonly description: string;
  readonly amountCents: number;
  readonly direction: EntryDirection;
  readonly externalId: string | null;
};

export type PreparedImportRow = ParsedImportRow & {
  readonly categoryId: string | null;
  readonly nature: EntryNature | null;
  readonly economicEvent: EconomicEvent | null;
};

export const importSourceLabels: Record<ImportSource, string> = {
  NUBANK_CSV: "Cartão de Crédito",
  NU_CONTA_CSV: "Conta Corrente",
};

export const importStatusLabels: Record<ImportStatus, string> = {
  PENDING: "Pendente",
  PENDING_REVIEW: "Em revisao",
  CONFIRMED: "Confirmada",
  CANCELLED: "Cancelada",
};
