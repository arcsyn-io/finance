import { CategoryService } from "@/server/services/category-service";
import { categoryRepository } from "../repositories/category-repository";
import { unitOfWork } from "../unit-of-work/drizzle-unit-of-work";

export function createCategoryService(): CategoryService {
  return new CategoryService({
    repository: categoryRepository,
    unitOfWork,
  });
}
