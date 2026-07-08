import type { Category } from "../../../domain/category/category";
import type { ListCategoriesCommand } from "../../commands/category-commands";
import type { ApplicationContext } from "../../context/application-context";
import type { CategoryRepository } from "../../repositories/category-repository";

export class ListCategoriesUseCase {
  constructor(private readonly repository: CategoryRepository) {}

  async execute(
    context: ApplicationContext,
    command: ListCategoriesCommand,
  ): Promise<Category[]> {
    return this.repository.list(context, {
      includeInactive: command.includeInactive,
    });
  }
}
