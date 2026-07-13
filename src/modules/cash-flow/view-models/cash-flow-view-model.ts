export type CashFlowMonthViewModel = {
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

export type CashFlowCategoryViewModel = {
  readonly categoryId: string | null;
  readonly categoryName: string;
  readonly categoryColor: string | null;
  readonly monthlyAmountsCents: readonly number[];
  readonly totalCents: number;
};

export type AnnualCashFlowViewModel = {
  readonly year: number;
  readonly months: readonly CashFlowMonthViewModel[];
  readonly operationalIncomeCategories: readonly CashFlowCategoryViewModel[];
  readonly operationalExpenseCategories: readonly CashFlowCategoryViewModel[];
  readonly nonOperationalIncomeCategories: readonly CashFlowCategoryViewModel[];
  readonly nonOperationalExpenseCategories: readonly CashFlowCategoryViewModel[];
};
