import type { Entry } from "../../../domain/entry/entry";
import {
  EntryNotFoundError,
  InvalidEntryError,
} from "../../../domain/entry/entry-errors";
import type { UnlinkEntryTransferCommand } from "../../commands/entry-commands";
import type { ApplicationContext } from "../../context/application-context";
import type { EntryRepository } from "../../repositories/entry-repository";
import type { TransferRepository } from "../../repositories/transfer-repository";

export type UnlinkEntryTransferResult = {
  readonly transferId: string;
  readonly entries: readonly Entry[];
};

export class UnlinkEntryTransferUseCase {
  constructor(
    private readonly entryRepository: EntryRepository,
    private readonly transferRepository: TransferRepository,
  ) {}

  async execute(
    context: ApplicationContext,
    command: UnlinkEntryTransferCommand,
  ): Promise<UnlinkEntryTransferResult> {
    const source = await this.entryRepository.findById(
      context,
      command.entryId,
    );

    if (!source) {
      throw new EntryNotFoundError();
    }

    if (!source.transferId) {
      throw new InvalidEntryError(
        "Lancamento nao esta vinculado a uma transferencia",
      );
    }

    const transferId = source.transferId;
    const entries = await this.entryRepository.findByTransferId(
      context,
      transferId,
    );

    const updatedEntries = await Promise.all(
      entries.map((entry) =>
        this.entryRepository.clearTransferId(context, entry.id),
      ),
    );

    await this.transferRepository.delete(context, transferId);

    return { transferId, entries: updatedEntries };
  }
}
