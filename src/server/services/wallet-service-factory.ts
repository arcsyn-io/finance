import { walletRepository } from "@/server/repositories/wallet-repository";
import { WalletService } from "@/server/services/wallet-service";
import { noopUnitOfWork } from "@/server/unit-of-work/noop-unit-of-work";

export function createWalletService(): WalletService {
  return new WalletService({
    repository: walletRepository,
    unitOfWork: noopUnitOfWork,
  });
}
