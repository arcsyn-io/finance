import {
  hasImportSuggestionTokens,
  suggestImportFields,
  type ImportSuggestionHistoryEntry,
} from "../../../domain/import/import-suggestion";
import type { PreparedImportRow } from "../../../domain/import/import";
import type { ApplicationContext } from "../../context/application-context";
import type { PrepareImportRowsInput } from "../../dto/import-suggestion-dto";
import type { EntryRepository } from "../../repositories/entry-repository";

const historyLimit = 1000;

export class PrepareImportRowsUseCase {
  constructor(private readonly entryRepository: EntryRepository) {}

  async execute(
    context: ApplicationContext,
    input: PrepareImportRowsInput,
  ): Promise<readonly PreparedImportRow[]> {
    const historyByDirection = new Map<
      string,
      readonly ImportSuggestionHistoryEntry[]
    >();
    const preparedRows: PreparedImportRow[] = [];

    for (const row of input.rows) {
      const needsSuggestion =
        input.defaultCategoryId === null ||
        input.nature === null ||
        input.economicEvent === null;
      let suggestion = suggestImportFields(row.description, []);

      if (needsSuggestion && hasImportSuggestionTokens(row.description)) {
        const historyKey = `${row.direction}:${input.defaultWalletId ?? "all"}`;
        let history = historyByDirection.get(historyKey);

        if (!history) {
          history = await this.entryRepository.listSuggestionHistory(context, {
            direction: row.direction,
            walletId: input.defaultWalletId,
            limit: historyLimit,
          });
          historyByDirection.set(historyKey, history);
        }

        suggestion = suggestImportFields(row.description, history);
      }

      preparedRows.push({
        ...row,
        walletId: input.defaultWalletId,
        categoryId:
          input.defaultCategoryId ?? suggestion.categoryId,
        nature: input.nature ?? suggestion.nature,
        economicEvent:
          input.economicEvent ?? suggestion.economicEvent,
      });
    }

    return preparedRows;
  }
}
