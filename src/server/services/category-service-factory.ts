import { CategoryService } from "@/server/services/category-service";
import { categoryRepository } from "../repositories/category-repository";
import { noopUnitOfWork } from "../unit-of-work/noop-unit-of-work";

export function createCategoryService(): CategoryService {
  return new CategoryService({
    repository: categoryRepository,
    unitOfWork: noopUnitOfWork,
  });
}
