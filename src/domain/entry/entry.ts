export const entryNatures = ["OPERATIONAL", "PATRIMONIAL"] as const;
export const entryDirections = ["IN", "OUT"] as const;
export const economicEvents = [
  "INCOME",
  "CAPITAL_INCOME",
  "CONSUMPTION",
  "INVESTMENT",
  "DIVESTMENT",
  "LIQUIDATION",
  "TRANSFER",
  "ADJUSTMENT",
  "LOSS",
  "INITIAL_BALANCE",
] as const;

export type EntryNature = (typeof entryNatures)[number];
export type EntryDirection = (typeof entryDirections)[number];
export type EconomicEvent = (typeof economicEvents)[number];

export type Entry = {
  readonly id: string;
  readonly userId: string;
  readonly legacyId?: number | null;
  readonly walletId: string;
  readonly categoryId: string | null;
  readonly transferId: string | null;
  readonly economicEventId: string | null;
  readonly nature: EntryNature;
  readonly direction: EntryDirection;
  readonly amountCents: number;
  readonly occurredOn: string;
  readonly description: string | null;
  readonly externalId: string | null;
  readonly economicEvent: EconomicEvent | null;
  readonly receiptPath: string | null;
  readonly attachmentCount?: number;
  readonly deletedAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly walletName: string | null;
  readonly categoryName: string | null;
  readonly categoryColor: string | null;
  readonly categoryIcon: string | null;
};

export const entryNatureLabels: Record<EntryNature, string> = {
  OPERATIONAL: "Operacional",
  PATRIMONIAL: "Patrimonial",
};

export const economicEventLabels: Record<EconomicEvent, string> = {
  INCOME: "Renda",
  CAPITAL_INCOME: "Renda de capital",
  CONSUMPTION: "Consumo",
  INVESTMENT: "Investimento",
  DIVESTMENT: "Desinvestimento",
  LIQUIDATION: "Liquidacao",
  TRANSFER: "Transferencia",
  ADJUSTMENT: "Ajuste",
  LOSS: "Perda",
  INITIAL_BALANCE: "Saldo inicial",
};
