import type { Wallet } from "../../../domain/wallet/wallet";
import { DuplicateWalletNameError } from "../../../domain/wallet/wallet-errors";
import type { CreateWalletCommand } from "../../commands/wallet-commands";
import type { ApplicationContext } from "../../context/application-context";
import type { WalletRepository } from "../../repositories/wallet-repository";
import {
  normalizeInitialBalanceCents,
  validateAndNormalizeWalletName,
  validateWalletType,
} from "./wallet-validation";

export class CreateWalletUseCase {
  constructor(private readonly repository: WalletRepository) {}

  async execute(
    context: ApplicationContext,
    input: CreateWalletCommand,
  ): Promise<Wallet> {
    const name = validateAndNormalizeWalletName(input.name);
    const type = validateWalletType(input.type);
    const initialBalanceCents = normalizeInitialBalanceCents(
      input.initialBalanceCents,
    );
    const duplicate = await this.repository.findByName(context, name);

    if (duplicate) {
      throw new DuplicateWalletNameError();
    }

    return this.repository.create(context, {
      name,
      type,
      initialBalanceCents,
      active: input.active ?? true,
    });
  }
}
