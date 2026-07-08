import type { Category, CategoryType } from "../../../domain/category/category";
import type { ApplicationContext } from "../../context/application-context";
import type { CategoryRepository } from "../../repositories/category-repository";

export class ListActiveCategoriesByTypeUseCase {
  constructor(private readonly repository: CategoryRepository) {}

  async execute(
    context: ApplicationContext,
    input: { type: CategoryType },
  ): Promise<Category[]> {
    return this.repository.listActiveByType(context, input.type);
  }
}
