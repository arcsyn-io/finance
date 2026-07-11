import { CategoryNotFoundError } from "../../../domain/category/category-errors";
import type { Entry, EntryDirection } from "../../../domain/entry/entry";
import {
  EntryNotFoundError,
  InvalidEntryError,
} from "../../../domain/entry/entry-errors";
import { WalletNotFoundError } from "../../../domain/wallet/wallet-errors";
import type { LinkEntryTransferCommand } from "../../commands/entry-commands";
import type { ApplicationContext } from "../../context/application-context";
import type { CategoryRepository } from "../../repositories/category-repository";
import type { EntryRepository } from "../../repositories/entry-repository";
import type { TransferRepository } from "../../repositories/transfer-repository";
import type { WalletRepository } from "../../repositories/wallet-repository";
import {
  assertWalletAcceptsEntries,
  inferDirection,
  validateNature,
} from "./entry-validation";

export type LinkEntryTransferResult = {
  readonly transferId: string;
  readonly entries: readonly Entry[];
};

export class LinkEntryTransferUseCase {
  constructor(
    private readonly entryRepository: EntryRepository,
    private readonly transferRepository: TransferRepository,
    private readonly walletRepository: WalletRepository,
    private readonly categoryRepository: CategoryRepository,
  ) {}

  async execute(
    context: ApplicationContext,
    command: LinkEntryTransferCommand,
  ): Promise<LinkEntryTransferResult> {
    const source = await this.requireLinkableSource(
      context,
      command.sourceEntryId,
    );

    if (command.mode === "existing") {
      return this.linkExisting(context, source, command.targetEntryId);
    }

    return this.createAndLink(context, source, command);
  }

  private async linkExisting(
    context: ApplicationContext,
    source: Entry,
    targetEntryId: string,
  ): Promise<LinkEntryTransferResult> {
    const target = await this.entryRepository.findById(context, targetEntryId);

    if (!target) {
      throw new EntryNotFoundError("Lancamento de destino nao encontrado");
    }

    this.assertLinkableEntry(target, "Lancamento de destino");

    if (source.walletId === target.walletId) {
      throw new InvalidEntryError(
        "Os lancamentos devem ser de carteiras diferentes",
      );
    }

    if (source.direction === target.direction) {
      throw new InvalidEntryError(
        "Os lancamentos devem ter direcoes opostas",
      );
    }

    if (source.amountCents !== target.amountCents) {
      throw new InvalidEntryError("Os lancamentos devem ter o mesmo valor");
    }

    const { inEntry, outEntry } = splitTransferEntries(source, target);
    const transfer = await this.transferRepository.create(context, {
      fromWalletId: outEntry.walletId,
      toWalletId: inEntry.walletId,
      fromCategoryId: requireCategoryId(outEntry),
      toCategoryId: requireCategoryId(inEntry),
      amountCents: outEntry.amountCents,
      occurredOn:
        outEntry.occurredOn > inEntry.occurredOn
          ? outEntry.occurredOn
          : inEntry.occurredOn,
      description: outEntry.description,
    });

    const updatedOut = await this.entryRepository.setTransferId(
      context,
      outEntry.id,
      transfer.id,
    );
    const updatedIn = await this.entryRepository.setTransferId(
      context,
      inEntry.id,
      transfer.id,
    );

    return { transferId: transfer.id, entries: [updatedOut, updatedIn] };
  }

  private async createAndLink(
    context: ApplicationContext,
    source: Entry,
    command: Extract<LinkEntryTransferCommand, { mode: "create" }>,
  ): Promise<LinkEntryTransferResult> {
    const nature = validateNature(command.nature);
    const wallet = await this.walletRepository.findById(context, command.walletId);
    if (!wallet) {
      throw new WalletNotFoundError();
    }
    assertWalletAcceptsEntries(wallet);

    if (source.walletId === wallet.id) {
      throw new InvalidEntryError(
        "Carteira deve ser diferente da carteira de origem",
      );
    }

    const category = await this.categoryRepository.findById(
      context,
      command.categoryId,
    );
    if (!category) {
      throw new CategoryNotFoundError();
    }

    const targetDirection: EntryDirection =
      source.direction === "OUT" ? "IN" : "OUT";
    const categoryDirection = inferDirection(category);
    if (categoryDirection !== targetDirection) {
      throw new InvalidEntryError(
        `Categoria deve ser do tipo ${targetDirection === "IN" ? "Receita" : "Despesa"}`,
      );
    }

    const description = command.description?.trim() || source.description;
    const targetDraft = {
      walletId: wallet.id,
      categoryId: category.id,
      nature,
      direction: targetDirection,
      economicEvent: "TRANSFER" as const,
      amountCents: source.amountCents,
      occurredOn: source.occurredOn,
      description,
    };
    const targetForTransfer: Entry = {
      ...source,
      ...targetDraft,
      id: "__new__",
      transferId: null,
    };
    const { inEntry, outEntry } = splitTransferEntries(source, targetForTransfer);
    const transfer = await this.transferRepository.create(context, {
      fromWalletId: outEntry.walletId,
      toWalletId: inEntry.walletId,
      fromCategoryId: requireCategoryId(outEntry),
      toCategoryId: requireCategoryId(inEntry),
      amountCents: source.amountCents,
      occurredOn: source.occurredOn,
      description,
    });

    const target = await this.entryRepository.createWithTransfer(context, {
      ...targetDraft,
      transferId: transfer.id,
    });
    const updatedSource = await this.entryRepository.setTransferId(
      context,
      source.id,
      transfer.id,
    );

    return { transferId: transfer.id, entries: [updatedSource, target] };
  }

  private async requireLinkableSource(
    context: ApplicationContext,
    sourceEntryId: string,
  ): Promise<Entry> {
    const source = await this.entryRepository.findById(context, sourceEntryId);

    if (!source) {
      throw new EntryNotFoundError("Lancamento de origem nao encontrado");
    }

    this.assertLinkableEntry(source, "Lancamento de origem");

    return source;
  }

  private assertLinkableEntry(entry: Entry, label: string): void {
    if (entry.deletedAt) {
      throw new InvalidEntryError(`${label} esta excluido`);
    }

    if (entry.transferId) {
      throw new InvalidEntryError(`${label} ja esta vinculado a uma transferencia`);
    }
  }
}

function splitTransferEntries(first: Entry, second: Entry) {
  return first.direction === "OUT"
    ? { outEntry: first, inEntry: second }
    : { outEntry: second, inEntry: first };
}

function requireCategoryId(entry: Entry): string {
  if (!entry.categoryId) {
    throw new InvalidEntryError("Lancamento de transferencia exige categoria");
  }

  return entry.categoryId;
}
