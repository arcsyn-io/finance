export type GetAnnualCashFlowCommand = {
  readonly year: number;
};

export type UpdateCashFlowConfigCommand = {
  readonly referenceMonth: string;
  readonly openingBalanceCents: number;
  readonly minimumCashCents: number;
  readonly applyToFollowingMonths: boolean;
};
