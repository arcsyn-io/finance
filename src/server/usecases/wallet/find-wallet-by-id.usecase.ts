import type { Wallet } from "../../../domain/wallet/wallet";
import { WalletNotFoundError } from "../../../domain/wallet/wallet-errors";
import type { ApplicationContext } from "../../context/application-context";
import type { WalletRepository } from "../../repositories/wallet-repository";

export class FindWalletByIdUseCase {
  constructor(private readonly repository: WalletRepository) {}

  async execute(
    context: ApplicationContext,
    input: { id: string },
  ): Promise<Wallet> {
    const wallet = await this.repository.findById(context, input.id);

    if (!wallet) {
      throw new WalletNotFoundError();
    }

    return wallet;
  }
}
