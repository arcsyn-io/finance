import type { Category } from "../../../domain/category/category";
import {
  CategoryNotFoundError,
  DuplicateCategoryNameError,
} from "../../../domain/category/category-errors";
import type { ApplicationContext } from "../../context/application-context";
import type { CategoryRepository } from "../../repositories/category-repository";
import {
  validateAndNormalizeCategoryName,
  validateCategoryType,
} from "./category-validation";

export class UpdateCategoryUseCase {
  constructor(private readonly repository: CategoryRepository) {}

  async execute(
    context: ApplicationContext,
    input: {
      id: string;
      name: string;
      type: Category["type"] | undefined;
      active: boolean;
    },
  ): Promise<Category> {
    const name = validateAndNormalizeCategoryName(input.name);
    const type = validateCategoryType(input.type);
    const existing = await this.repository.findById(context, input.id);

    if (!existing) {
      throw new CategoryNotFoundError();
    }

    const duplicate = await this.repository.findByName(context, name);

    if (duplicate && duplicate.id !== input.id) {
      throw new DuplicateCategoryNameError();
    }

    return this.repository.update(context, input.id, {
      name,
      type,
      active: input.active,
    });
  }
}
