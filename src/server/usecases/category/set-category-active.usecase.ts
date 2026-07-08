import type { Category } from "../../../domain/category/category";
import { CategoryNotFoundError } from "../../../domain/category/category-errors";
import type { ApplicationContext } from "../../context/application-context";
import type { CategoryRepository } from "../../repositories/category-repository";

export class SetCategoryActiveUseCase {
  constructor(private readonly repository: CategoryRepository) {}

  async execute(
    context: ApplicationContext,
    input: { id: string; active: boolean },
  ): Promise<Category> {
    const existing = await this.repository.findById(context, input.id);

    if (!existing) {
      throw new CategoryNotFoundError();
    }

    return this.repository.setActive(context, input.id, input.active);
  }
}
