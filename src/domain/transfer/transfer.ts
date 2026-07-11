export type Transfer = {
  readonly id: string;
  readonly userId: string;
  readonly legacyId?: number | null;
  readonly fromWalletId: string;
  readonly toWalletId: string;
  readonly fromCategoryId: string | null;
  readonly toCategoryId: string | null;
  readonly amountCents: number;
  readonly occurredOn: string;
  readonly description: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};
