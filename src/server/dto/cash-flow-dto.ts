export type MonthlyCashFlowDto = {
  readonly referenceMonth: string;
  readonly receiptsCents: number;
  readonly expensesCents: number;
  readonly netCashFlowCents: number;
  readonly openingBalanceCents: number;
  readonly closingBalanceCents: number;
  readonly minimumCashCents: number;
  readonly surplusOrDeficitCents: number;
  readonly nonOperationalCashInCents: number;
  readonly nonOperationalCashOutCents: number;
  readonly nonOperationalNetCashFlowCents: number;
};

export type CashFlowCategoryDto = {
  readonly categoryId: string | null;
  readonly categoryName: string;
  readonly categoryColor: string | null;
  readonly monthlyAmountsCents: readonly number[];
  readonly totalCents: number;
};

export type AnnualCashFlowDto = {
  readonly year: number;
  readonly months: readonly MonthlyCashFlowDto[];
  readonly operationalIncomeCategories: readonly CashFlowCategoryDto[];
  readonly operationalExpenseCategories: readonly CashFlowCategoryDto[];
  readonly nonOperationalIncomeCategories: readonly CashFlowCategoryDto[];
  readonly nonOperationalExpenseCategories: readonly CashFlowCategoryDto[];
};
