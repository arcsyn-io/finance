import type { Category } from "../../../domain/category/category";
import {
  normalizeCategoryColor,
  normalizeCategoryIcon,
} from "../../../domain/category/category-visual";
import { DuplicateCategoryNameError } from "../../../domain/category/category-errors";
import type { ApplicationContext } from "../../context/application-context";
import type { CategoryRepository } from "../../repositories/category-repository";
import {
  validateAndNormalizeCategoryName,
  validateCategoryType,
} from "./category-validation";

export class CreateCategoryUseCase {
  constructor(private readonly repository: CategoryRepository) {}

  async execute(
    context: ApplicationContext,
    input: {
      name: string;
      type: Category["type"] | undefined;
      icon?: string;
      color?: string;
      active?: boolean;
    },
  ): Promise<Category> {
    const name = validateAndNormalizeCategoryName(input.name);
    const type = validateCategoryType(input.type);
    const duplicate = await this.repository.findByName(context, name);

    if (duplicate) {
      throw new DuplicateCategoryNameError();
    }

    return this.repository.create(context, {
      name,
      type,
      icon: normalizeCategoryIcon(input.icon),
      color: normalizeCategoryColor(input.color, type),
      active: input.active ?? true,
    });
  }
}
