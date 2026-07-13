import {
  and,
  desc,
  eq,
  isNotNull,
  isNull,
} from "drizzle-orm";
import type { db } from "../../db/client";
import { categories, entries } from "../../db/schema";
import type { ListImportSuggestionHistoryQuery } from "../dto/import-suggestion-dto";

type FinanceDatabase = typeof db;

export function buildImportSuggestionHistoryQuery(
  database: FinanceDatabase,
  userId: string,
  query: ListImportSuggestionHistoryQuery,
) {
  const conditions = [
    eq(entries.userId, userId),
    eq(categories.userId, userId),
    eq(entries.direction, query.direction),
    isNull(entries.deletedAt),
    isNull(entries.transferId),
    isNotNull(entries.categoryId),
  ];

  if (query.walletId) {
    conditions.push(eq(entries.walletId, query.walletId));
  }

  return database
    .select({
      categoryId: entries.categoryId,
      nature: entries.nature,
      economicEvent: entries.economicEvent,
      description: entries.description,
    })
    .from(entries)
    .innerJoin(categories, eq(entries.categoryId, categories.id))
    .where(and(...conditions))
    .orderBy(
      desc(entries.occurredOn),
      desc(entries.createdAt),
      desc(entries.id),
    )
    .limit(query.limit);
}
