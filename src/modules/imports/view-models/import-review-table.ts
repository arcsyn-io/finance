export type ImportRowNavigationField =
  | "amountCents"
  | "categoryId"
  | "description"
  | "economicEvent"
  | "nature"
  | "occurredOn"
  | "walletId";

export const importRowNavigationFields: readonly ImportRowNavigationField[] = [
  "occurredOn",
  "categoryId",
  "description",
  "walletId",
  "nature",
  "economicEvent",
  "amountCents",
];

export const importReviewTableHeadings = [
  "",
  "Data",
  "Categoria",
  "Descricao",
  "Carteira",
  "Natureza",
  "Evento",
  "Valor",
  "Status",
  "",
] as const;
