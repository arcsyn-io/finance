import type { Wallet } from "../../../domain/wallet/wallet";
import { WalletNotFoundError } from "../../../domain/wallet/wallet-errors";
import type { ApplicationContext } from "../../context/application-context";
import type { WalletRepository } from "../../repositories/wallet-repository";

export class SetWalletActiveUseCase {
  constructor(private readonly repository: WalletRepository) {}

  async execute(
    context: ApplicationContext,
    input: { id: string; active: boolean },
  ): Promise<Wallet> {
    const existing = await this.repository.findById(context, input.id);

    if (!existing) {
      throw new WalletNotFoundError();
    }

    return this.repository.setActive(context, input.id, input.active);
  }
}
