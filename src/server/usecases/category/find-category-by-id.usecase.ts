import type { Category } from "../../../domain/category/category";
import { CategoryNotFoundError } from "../../../domain/category/category-errors";
import type { ApplicationContext } from "../../context/application-context";
import type { CategoryRepository } from "../../repositories/category-repository";

export class FindCategoryByIdUseCase {
  constructor(private readonly repository: CategoryRepository) {}

  async execute(
    context: ApplicationContext,
    input: { id: string },
  ): Promise<Category> {
    const category = await this.repository.findById(context, input.id);

    if (!category) {
      throw new CategoryNotFoundError();
    }

    return category;
  }
}
