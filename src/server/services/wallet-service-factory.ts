import { walletRepository } from "@/server/repositories/wallet-repository";
import { WalletService } from "@/server/services/wallet-service";
import { unitOfWork } from "@/server/unit-of-work/drizzle-unit-of-work";

export function createWalletService(): WalletService {
  return new WalletService({
    repository: walletRepository,
    unitOfWork,
  });
}
