import type { Wallet } from "../../../domain/wallet/wallet";
import {
  DuplicateWalletNameError,
  WalletNotFoundError,
} from "../../../domain/wallet/wallet-errors";
import type { UpdateWalletCommand } from "../../commands/wallet-commands";
import type { ApplicationContext } from "../../context/application-context";
import type { WalletRepository } from "../../repositories/wallet-repository";
import {
  normalizeInitialBalanceCents,
  validateAndNormalizeWalletName,
  validateWalletType,
} from "./wallet-validation";

export class UpdateWalletUseCase {
  constructor(private readonly repository: WalletRepository) {}

  async execute(
    context: ApplicationContext,
    input: UpdateWalletCommand,
  ): Promise<Wallet> {
    const existing = await this.repository.findById(context, input.id);

    if (!existing) {
      throw new WalletNotFoundError();
    }

    const name = validateAndNormalizeWalletName(input.name);
    const type = validateWalletType(input.type);
    const initialBalanceCents = normalizeInitialBalanceCents(
      input.initialBalanceCents,
    );
    const duplicate = await this.repository.findByName(context, name);

    if (duplicate && duplicate.id !== input.id) {
      throw new DuplicateWalletNameError();
    }

    return this.repository.update(context, input.id, {
      name,
      type,
      initialBalanceCents,
      active: input.active,
    });
  }
}
