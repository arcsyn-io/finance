import {
  type CategoryType,
  isCategoryType,
  normalizeCategoryName,
} from "../../../domain/category/category";
import { InvalidCategoryError } from "../../../domain/category/category-errors";

export function validateAndNormalizeCategoryName(name: string): string {
  const normalizedName = normalizeCategoryName(name);

  if (!normalizedName) {
    throw new InvalidCategoryError("Nome da categoria e obrigatorio");
  }

  return normalizedName;
}

export function validateCategoryType(type: CategoryType | undefined): CategoryType {
  if (!isCategoryType(type)) {
    throw new InvalidCategoryError("Tipo da categoria e obrigatorio");
  }

  return type;
}
