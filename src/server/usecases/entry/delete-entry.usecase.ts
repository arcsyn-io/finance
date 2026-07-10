import type { Entry } from "../../../domain/entry/entry";
import {
  EntryNotFoundError,
  InvalidEntryError,
} from "../../../domain/entry/entry-errors";
import type { ApplicationContext } from "../../context/application-context";
import type { EntryRepository } from "../../repositories/entry-repository";

export class DeleteEntryUseCase {
  constructor(private readonly repository: EntryRepository) {}

  async execute(context: ApplicationContext, id: string): Promise<Entry> {
    const entry = await this.repository.findById(context, id);

    if (!entry) {
      throw new EntryNotFoundError();
    }

    if (entry.deletedAt) {
      throw new InvalidEntryError("Lancamento ja esta excluido");
    }

    return this.repository.softDelete(context, id);
  }
}
