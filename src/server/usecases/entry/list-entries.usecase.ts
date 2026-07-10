import type { Entry } from "../../../domain/entry/entry";
import type { ApplicationContext } from "../../context/application-context";
import type {
  EntryRepository,
  ListEntriesFilters,
} from "../../repositories/entry-repository";

export class ListEntriesUseCase {
  constructor(private readonly repository: EntryRepository) {}

  execute(
    context: ApplicationContext,
    filters: ListEntriesFilters,
  ): Promise<Entry[]> {
    return this.repository.list(context, filters);
  }
}
