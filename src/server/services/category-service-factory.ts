import { categoryRepository } from "@/server/repositories/category-repository";
import { CategoryService } from "@/server/services/category-service";
import { unitOfWork } from "@/server/unit-of-work/drizzle-unit-of-work";

export function createCategoryService(): CategoryService {
  return new CategoryService({
    repository: categoryRepository,
    unitOfWork,
  });
}
