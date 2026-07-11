import { categoryRepository } from "@/server/repositories/category-repository";
import { entryRepository } from "@/server/repositories/entry-repository";
import { transferRepository } from "@/server/repositories/transfer-repository";
import { walletRepository } from "@/server/repositories/wallet-repository";
import { EntryService } from "@/server/services/entry-service";
import { noopUnitOfWork } from "@/server/unit-of-work/noop-unit-of-work";

export function createEntryService(): EntryService {
  return new EntryService({
    repository: entryRepository,
    transferRepository,
    walletRepository,
    categoryRepository,
    unitOfWork: noopUnitOfWork,
  });
}
