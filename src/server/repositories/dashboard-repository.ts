import "server-only";

import { and, asc, desc, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { categories, entries, wallets } from "@/db/schema";
import type { EntryDirection } from "@/domain/entry/entry";
import type { WalletType } from "@/domain/wallet/wallet";
import type { ApplicationContext } from "@/server/context/application-context";
import { resolveDatabaseClient } from "@/server/repositories/database-client";

export type DashboardWalletBalanceRow = {
  readonly id: string;
  readonly name: string;
  readonly type: WalletType;
  readonly balanceCents: number;
};

export type DashboardRecentEntryRow = {
  readonly id: string;
  readonly description: string | null;
  readonly direction: EntryDirection;
  readonly amountCents: number;
  readonly occurredOn: string;
  readonly walletName: string;
  readonly categoryName: string | null;
};

export interface DashboardRepository {
  listActiveWalletBalances(
    context: ApplicationContext,
  ): Promise<readonly DashboardWalletBalanceRow[]>;

  listRecentEntries(
    context: ApplicationContext,
    options: { readonly limit: number },
  ): Promise<readonly DashboardRecentEntryRow[]>;
}

export class DrizzleDashboardRepository implements DashboardRepository {
  async listActiveWalletBalances(
    context: ApplicationContext,
  ): Promise<readonly DashboardWalletBalanceRow[]> {
    const userId = context.requireUserPrincipal().id;
    const database = resolveDatabaseClient(context, db);
    const entryBalanceCents = sql<string>`coalesce(sum(case when ${entries.direction} = 'IN' then ${entries.amountCents} else -${entries.amountCents} end), 0)`;
    const balanceCents = sql<string>`${wallets.initialBalanceCents} + ${entryBalanceCents}`;
    const rows = await database
      .select({
        id: wallets.id,
        name: wallets.name,
        type: wallets.type,
        balanceCents,
      })
      .from(wallets)
      .leftJoin(
        entries,
        and(
          eq(entries.walletId, wallets.id),
          eq(entries.userId, userId),
          isNull(entries.deletedAt),
        ),
      )
      .where(and(eq(wallets.userId, userId), eq(wallets.active, true)))
      .groupBy(wallets.id, wallets.name, wallets.type, wallets.initialBalanceCents)
      .orderBy(asc(wallets.name));

    return rows.map((row) => ({
      ...row,
      balanceCents: Number(row.balanceCents),
    }));
  }

  async listRecentEntries(
    context: ApplicationContext,
    options: { readonly limit: number },
  ): Promise<readonly DashboardRecentEntryRow[]> {
    const userId = context.requireUserPrincipal().id;
    const database = resolveDatabaseClient(context, db);
    const rows = await database
      .select({
        id: entries.id,
        description: entries.description,
        direction: entries.direction,
        amountCents: entries.amountCents,
        occurredOn: entries.occurredOn,
        walletName: wallets.name,
        categoryName: categories.name,
      })
      .from(entries)
      .innerJoin(wallets, eq(entries.walletId, wallets.id))
      .leftJoin(categories, eq(entries.categoryId, categories.id))
      .where(and(eq(entries.userId, userId), isNull(entries.deletedAt)))
      .orderBy(desc(entries.occurredOn), desc(entries.createdAt))
      .limit(options.limit);

    return rows;
  }
}

export const dashboardRepository = new DrizzleDashboardRepository();
