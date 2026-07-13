import "server-only";

import { and, asc, eq, gte, isNull, lt, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { categories, entries } from "@/db/schema";
import {
  consumptionEconomicEvent,
  toExclusiveEndDate,
} from "@/domain/entry/consumption";
import type { ApplicationContext } from "@/server/context/application-context";
import { resolveDatabaseClient } from "@/server/repositories/database-client";

export type MonthlyCategoryConsumptionRow = {
  readonly categoryId: string;
  readonly categoryName: string;
  readonly categoryColor: string;
  readonly categoryIcon: string;
  readonly month: string;
  readonly amountCents: number;
};

export interface ConsumptionRepository {
  listMonthlyByCategory(
    context: ApplicationContext,
    range: { readonly startDate: string; readonly endDate: string },
  ): Promise<MonthlyCategoryConsumptionRow[]>;
}

export class DrizzleConsumptionRepository implements ConsumptionRepository {
  async listMonthlyByCategory(
    context: ApplicationContext,
    range: { readonly startDate: string; readonly endDate: string },
  ): Promise<MonthlyCategoryConsumptionRow[]> {
    const userId = context.requireUserPrincipal().id;
    const database = resolveDatabaseClient(context, db);
    const month = sql<string>`to_char(${entries.occurredOn}::date, 'YYYY-MM')`;
    const amount = sql<string>`sum(${entries.amountCents})`;
    const rows = await database
      .select({
        categoryId: categories.id,
        categoryName: categories.name,
        categoryColor: categories.color,
        categoryIcon: categories.icon,
        month,
        amountCents: amount,
      })
      .from(entries)
      .innerJoin(categories, eq(entries.categoryId, categories.id))
      .where(
        and(
          eq(entries.userId, userId),
          eq(categories.userId, userId),
          eq(entries.economicEvent, consumptionEconomicEvent),
          isNull(entries.deletedAt),
          gte(entries.occurredOn, range.startDate),
          lt(entries.occurredOn, toExclusiveEndDate(range.endDate)),
        ),
      )
      .groupBy(categories.id, categories.name, categories.color, categories.icon, month)
      .orderBy(asc(month), asc(categories.name));

    return rows.map((row) => ({
      ...row,
      amountCents: Number(row.amountCents),
    }));
  }
}

export const consumptionRepository = new DrizzleConsumptionRepository();
