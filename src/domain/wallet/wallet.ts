export const walletTypes = [
  "CASH",
  "CREDIT_CARD",
  "NEGOTIABLE_SECURITY",
  "LONG_TERM",
  "ASSET",
] as const;

export type WalletType = (typeof walletTypes)[number];

export type Wallet = {
  readonly id: string;
  readonly userId: string;
  readonly legacyId?: number | null;
  readonly name: string;
  readonly type: WalletType;
  readonly initialBalanceCents: number;
  readonly active: boolean;
  readonly archivedAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

export const walletTypeLabels: Record<WalletType, string> = {
  CASH: "Caixa",
  CREDIT_CARD: "Cartao de Credito",
  NEGOTIABLE_SECURITY: "Titulo Negociavel",
  LONG_TERM: "Longo Prazo",
  ASSET: "Bem Patrimonial",
};
