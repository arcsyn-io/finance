export const categoryTypes = ["INCOME", "EXPENSE"] as const;

export type CategoryType = (typeof categoryTypes)[number];

export type Category = {
  readonly id: string;
  readonly userId: string;
  readonly legacyId?: number | null;
  readonly name: string;
  readonly type: CategoryType;
  readonly icon: string;
  readonly color: string;
  readonly active: boolean;
  readonly archivedAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

export function isCategoryType(value: unknown): value is CategoryType {
  return (
    typeof value === "string" &&
    categoryTypes.includes(value as CategoryType)
  );
}

export function normalizeCategoryName(name: string): string {
  return name.trim();
}
