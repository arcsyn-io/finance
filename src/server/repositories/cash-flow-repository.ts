import "server-only";

import { and, asc, eq, gte, isNull, lte, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { cashFlowConfigs, categories, entries, wallets } from "@/db/schema";
import type { ApplicationContext } from "@/server/context/application-context";
import { resolveDatabaseClient } from "@/server/repositories/database-client";

export type CashFlowScope = "OPERATIONAL" | "NON_OPERATIONAL";
export type CashFlowDirection = "IN" | "OUT";

export type CashFlowAggregateRow = {
  readonly month: string;
  readonly scope: CashFlowScope;
  readonly direction: CashFlowDirection;
  readonly categoryId: string | null;
  readonly categoryName: string | null;
  readonly categoryColor: string | null;
  readonly amountCents: number;
};

export type CashFlowConfigRecord = {
  readonly referenceMonth: string;
  readonly openingBalanceCents: number;
  readonly minimumCashCents: number;
};

export type UpsertCashFlowConfigData = CashFlowConfigRecord;

export interface CashFlowRepository {
  listAnnualAggregates(
    context: ApplicationContext,
    options: { readonly year: number },
  ): Promise<readonly CashFlowAggregateRow[]>;

  listConfigsByYear(
    context: ApplicationContext,
    options: { readonly year: number },
  ): Promise<readonly CashFlowConfigRecord[]>;

  upsertMany(
    context: ApplicationContext,
    configs: readonly UpsertCashFlowConfigData[],
  ): Promise<void>;
}

export class DrizzleCashFlowRepository implements CashFlowRepository {
  async listAnnualAggregates(
    context: ApplicationContext,
    options: { readonly year: number },
  ): Promise<CashFlowAggregateRow[]> {
    const userId = context.requireUserPrincipal().id;
    const database = resolveDatabaseClient(context, db);
    const month = sql<string>`to_char(${entries.occurredOn}::date, 'YYYY-MM')`;
    const scope = sql<CashFlowScope>`case
      when ${entries.nature} = 'OPERATIONAL' and ${entries.transferId} is null
        then 'OPERATIONAL'
      else 'NON_OPERATIONAL'
    end`;
    const amountCents = sql<string>`sum(${entries.amountCents})`;
    const startDate = `${options.year}-01-01`;
    const endDate = `${options.year}-12-31`;

    const rows = await database
      .select({
        month,
        scope,
        direction: entries.direction,
        categoryId: categories.id,
        categoryName: categories.name,
        categoryColor: categories.color,
        amountCents,
      })
      .from(entries)
      .innerJoin(
        wallets,
        and(
          eq(entries.walletId, wallets.id),
          eq(wallets.userId, userId),
          eq(wallets.type, "CASH"),
        ),
      )
      .leftJoin(
        categories,
        and(eq(entries.categoryId, categories.id), eq(categories.userId, userId)),
      )
      .where(
        and(
          eq(entries.userId, userId),
          isNull(entries.deletedAt),
          gte(entries.occurredOn, startDate),
          lte(entries.occurredOn, endDate),
        ),
      )
      .groupBy(
        month,
        scope,
        entries.direction,
        categories.id,
        categories.name,
        categories.color,
      )
      .orderBy(asc(month), asc(entries.direction), asc(categories.name));

    return rows.map((row) => ({
      ...row,
      amountCents: Number(row.amountCents),
    }));
  }

  async listConfigsByYear(
    context: ApplicationContext,
    options: { readonly year: number },
  ): Promise<CashFlowConfigRecord[]> {
    const userId = context.requireUserPrincipal().id;
    const database = resolveDatabaseClient(context, db);
    const startMonth = `${options.year}-01`;
    const endMonth = `${options.year}-12`;

    return database
      .select({
        referenceMonth: cashFlowConfigs.referenceMonth,
        openingBalanceCents: cashFlowConfigs.openingBalanceCents,
        minimumCashCents: cashFlowConfigs.minimumCashCents,
      })
      .from(cashFlowConfigs)
      .where(
        and(
          eq(cashFlowConfigs.userId, userId),
          gte(cashFlowConfigs.referenceMonth, startMonth),
          lte(cashFlowConfigs.referenceMonth, endMonth),
        ),
      )
      .orderBy(asc(cashFlowConfigs.referenceMonth));
  }

  async upsertMany(
    context: ApplicationContext,
    configs: readonly UpsertCashFlowConfigData[],
  ): Promise<void> {
    if (configs.length === 0) {
      return;
    }

    const userId = context.requireUserPrincipal().id;
    const database = resolveDatabaseClient(context, db);

    await database
      .insert(cashFlowConfigs)
      .values(
        configs.map((config) => ({
          userId,
          referenceMonth: config.referenceMonth,
          openingBalanceCents: config.openingBalanceCents,
          minimumCashCents: config.minimumCashCents,
          updatedAt: context.now,
        })),
      )
      .onConflictDoUpdate({
        target: [cashFlowConfigs.userId, cashFlowConfigs.referenceMonth],
        set: {
          openingBalanceCents: sql`excluded.opening_balance_cents`,
          minimumCashCents: sql`excluded.minimum_cash_cents`,
          updatedAt: context.now,
        },
      });
  }
}

export const cashFlowRepository = new DrizzleCashFlowRepository();
