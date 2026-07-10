import type { Wallet } from "../../../domain/wallet/wallet";
import type { ApplicationContext } from "../../context/application-context";
import type { WalletRepository } from "../../repositories/wallet-repository";

export class ListWalletsUseCase {
  constructor(private readonly repository: WalletRepository) {}

  async execute(
    context: ApplicationContext,
    input: { includeInactive: boolean },
  ): Promise<Wallet[]> {
    return this.repository.list(context, {
      includeInactive: input.includeInactive,
    });
  }
}
