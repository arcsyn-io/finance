import { categoryRepository } from "@/server/repositories/category-repository";
import { entryRepository } from "@/server/repositories/entry-repository";
import { importRepository } from "@/server/repositories/import-repository";
import { walletRepository } from "@/server/repositories/wallet-repository";
import { ImportService } from "@/server/services/import-service";
import { unitOfWork } from "@/server/unit-of-work/drizzle-unit-of-work";

export function createImportService(): ImportService {
  return new ImportService({
    repository: importRepository,
    entryRepository,
    walletRepository,
    categoryRepository,
    unitOfWork,
  });
}
