import { CategoryType } from "@/domain/category/category";

export type ListCategoriesCommand = {
  readonly includeInactive: boolean;
};

export type ListActiveCategoriesByTypeCommand = {
  readonly type: CategoryType;
};

export type CreateCategoryCommand = {
  readonly name: string;
  readonly type: CategoryType | undefined;
  readonly icon?: string;
  readonly color?: string;
  readonly active?: boolean;
};

export type UpdateCategoryCommand = {
  readonly id: string;
  readonly name: string;
  readonly type: CategoryType | undefined;
  readonly icon?: string;
  readonly color?: string;
  readonly active: boolean;
};

export type SetCategoryActiveCommand = {
  readonly id: string;
};
