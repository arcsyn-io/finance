export type CategoryConsumptionDto = {
  readonly categoryId: string;
  readonly name: string;
  readonly color: string;
  readonly icon: string;
  readonly totalCents: number;
  readonly percentage: number;
  readonly monthlyAmountsCents: readonly number[];
};

export type ConsumptionByCategoryDto = {
  readonly startDate: string;
  readonly endDate: string;
  readonly months: readonly string[];
  readonly totalCents: number;
  readonly categories: readonly CategoryConsumptionDto[];
};
