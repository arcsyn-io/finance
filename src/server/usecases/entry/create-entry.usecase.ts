import { CategoryNotFoundError } from "../../../domain/category/category-errors";
import type { Entry } from "../../../domain/entry/entry";
import { WalletNotFoundError } from "../../../domain/wallet/wallet-errors";
import type { CreateEntryCommand } from "../../commands/entry-commands";
import type { ApplicationContext } from "../../context/application-context";
import type { CategoryRepository } from "../../repositories/category-repository";
import type { EntryRepository } from "../../repositories/entry-repository";
import type { WalletRepository } from "../../repositories/wallet-repository";
import {
  assertWalletAcceptsEntries,
  inferDirection,
  inferEconomicEvent,
  validateAmountCents,
  validateNature,
  validateOccurredOn,
} from "./entry-validation";

export class CreateEntryUseCase {
  constructor(
    private readonly repository: EntryRepository,
    private readonly walletRepository: WalletRepository,
    private readonly categoryRepository: CategoryRepository,
  ) {}

  async execute(
    context: ApplicationContext,
    input: CreateEntryCommand,
  ): Promise<Entry> {
    validateAmountCents(input.amountCents);
    validateOccurredOn(input.occurredOn);
    const nature = validateNature(input.nature);

    const wallet = await this.walletRepository.findById(context, input.walletId);
    if (!wallet) {
      throw new WalletNotFoundError();
    }
    assertWalletAcceptsEntries(wallet);

    const category = await this.categoryRepository.findById(
      context,
      input.categoryId,
    );
    if (!category) {
      throw new CategoryNotFoundError();
    }

    const direction = inferDirection(category);
    const economicEvent =
      input.economicEvent ??
      inferEconomicEvent({
        direction,
        nature,
        transferId: null,
        walletType: wallet.type,
      });

    return this.repository.create(context, {
      walletId: wallet.id,
      categoryId: category.id,
      nature,
      direction,
      economicEvent,
      amountCents: input.amountCents,
      occurredOn: input.occurredOn,
      description: input.description?.trim() || null,
    });
  }
}
