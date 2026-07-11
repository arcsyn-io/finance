import "server-only";

import {
  and,
  desc,
  eq,
  gte,
  inArray,
  isNull,
  lte,
} from "drizzle-orm";
import { db } from "@/db/client";
import { categories, entries, wallets } from "@/db/schema";
import type {
  EconomicEvent,
  Entry,
  EntryDirection,
  EntryNature,
} from "@/domain/entry/entry";
import type { ApplicationContext } from "@/server/context/application-context";
import { resolveDatabaseClient } from "@/server/repositories/database-client";

export type ListEntriesFilters = {
  readonly startDate?: string;
  readonly endDate?: string;
  readonly walletIds?: readonly string[];
  readonly categoryIds?: readonly string[];
  readonly natures?: readonly EntryNature[];
  readonly economicEvents?: readonly EconomicEvent[];
  readonly includeDeleted: boolean;
};

export type CreateEntryData = {
  readonly walletId: string;
  readonly categoryId: string;
  readonly nature: EntryNature;
  readonly direction: EntryDirection;
  readonly economicEvent: EconomicEvent;
  readonly amountCents: number;
  readonly occurredOn: string;
  readonly description: string | null;
  readonly externalId?: string | null;
};

export type UpdateEntryData = CreateEntryData;

export type CreateTransferEntryData = CreateEntryData & {
  readonly transferId: string;
};

export interface EntryRepository {
  list(context: ApplicationContext, filters: ListEntriesFilters): Promise<Entry[]>;

  findById(context: ApplicationContext, id: string): Promise<Entry | null>;

  findByTransferId(
    context: ApplicationContext,
    transferId: string,
  ): Promise<Entry[]>;

  create(context: ApplicationContext, data: CreateEntryData): Promise<Entry>;

  createWithTransfer(
    context: ApplicationContext,
    data: CreateTransferEntryData,
  ): Promise<Entry>;

  update(
    context: ApplicationContext,
    id: string,
    data: UpdateEntryData,
  ): Promise<Entry>;

  softDelete(context: ApplicationContext, id: string): Promise<Entry>;

  restore(context: ApplicationContext, id: string): Promise<Entry>;

  setTransferId(
    context: ApplicationContext,
    id: string,
    transferId: string,
  ): Promise<Entry>;

  clearTransferId(context: ApplicationContext, id: string): Promise<Entry>;

  existsByExternalIdAndWallet(
    context: ApplicationContext,
    externalId: string,
    walletId: string,
  ): Promise<boolean>;
}

type EntryRow = {
  readonly entry: typeof entries.$inferSelect;
  readonly walletName: string | null;
  readonly categoryName: string | null;
  readonly categoryColor: string | null;
  readonly categoryIcon: string | null;
};

export class DrizzleEntryRepository implements EntryRepository {
  async list(
    context: ApplicationContext,
    filters: ListEntriesFilters,
  ): Promise<Entry[]> {
    const userId = context.requireUserPrincipal().id;
    const database = resolveDatabaseClient(context, db);
    const conditions = listConditions(userId, filters);
    const rows = await database
      .select(entrySelection)
      .from(entries)
      .leftJoin(wallets, eq(entries.walletId, wallets.id))
      .leftJoin(categories, eq(entries.categoryId, categories.id))
      .where(and(...conditions))
      .orderBy(desc(entries.occurredOn), desc(entries.createdAt));

    return rows.map(mapRowToEntry);
  }

  async findById(
    context: ApplicationContext,
    id: string,
  ): Promise<Entry | null> {
    const userId = context.requireUserPrincipal().id;
    const database = resolveDatabaseClient(context, db);
    const [row] = await database
      .select(entrySelection)
      .from(entries)
      .leftJoin(wallets, eq(entries.walletId, wallets.id))
      .leftJoin(categories, eq(entries.categoryId, categories.id))
      .where(and(eq(entries.userId, userId), eq(entries.id, id)))
      .limit(1);

    return row ? mapRowToEntry(row) : null;
  }

  async findByTransferId(
    context: ApplicationContext,
    transferId: string,
  ): Promise<Entry[]> {
    const userId = context.requireUserPrincipal().id;
    const database = resolveDatabaseClient(context, db);
    const rows = await database
      .select(entrySelection)
      .from(entries)
      .leftJoin(wallets, eq(entries.walletId, wallets.id))
      .leftJoin(categories, eq(entries.categoryId, categories.id))
      .where(and(eq(entries.userId, userId), eq(entries.transferId, transferId)))
      .orderBy(desc(entries.occurredOn), desc(entries.createdAt));

    return rows.map(mapRowToEntry);
  }

  async create(
    context: ApplicationContext,
    data: CreateEntryData,
  ): Promise<Entry> {
    const [row] = await this.insert(context, data);
    return this.requireEntry(context, row.id);
  }

  async createWithTransfer(
    context: ApplicationContext,
    data: CreateTransferEntryData,
  ): Promise<Entry> {
    const [row] = await this.insert(context, data, data.transferId);
    return this.requireEntry(context, row.id);
  }

  async update(
    context: ApplicationContext,
    id: string,
    data: UpdateEntryData,
  ): Promise<Entry> {
    const userId = context.requireUserPrincipal().id;
    const database = resolveDatabaseClient(context, db);
    const [row] = await database
      .update(entries)
      .set({
        walletId: data.walletId,
        categoryId: data.categoryId,
        nature: data.nature,
        direction: data.direction,
        economicEvent: data.economicEvent,
        amountCents: data.amountCents,
        occurredOn: data.occurredOn,
        description: data.description,
        updatedAt: context.now,
      })
      .where(and(eq(entries.userId, userId), eq(entries.id, id)))
      .returning({ id: entries.id });

    return this.requireEntry(context, row.id);
  }

  async softDelete(
    context: ApplicationContext,
    id: string,
  ): Promise<Entry> {
    return this.setDeletedAt(context, id, context.now);
  }

  async restore(
    context: ApplicationContext,
    id: string,
  ): Promise<Entry> {
    return this.setDeletedAt(context, id, null);
  }

  async setTransferId(
    context: ApplicationContext,
    id: string,
    transferId: string,
  ): Promise<Entry> {
    const userId = context.requireUserPrincipal().id;
    const database = resolveDatabaseClient(context, db);
    const [row] = await database
      .update(entries)
      .set({
        transferId,
        economicEvent: "TRANSFER",
        updatedAt: context.now,
      })
      .where(and(eq(entries.userId, userId), eq(entries.id, id)))
      .returning({ id: entries.id });

    return this.requireEntry(context, row.id);
  }

  async clearTransferId(
    context: ApplicationContext,
    id: string,
  ): Promise<Entry> {
    const userId = context.requireUserPrincipal().id;
    const database = resolveDatabaseClient(context, db);
    const [row] = await database
      .update(entries)
      .set({
        transferId: null,
        economicEvent: null,
        updatedAt: context.now,
      })
      .where(and(eq(entries.userId, userId), eq(entries.id, id)))
      .returning({ id: entries.id });

    return this.requireEntry(context, row.id);
  }

  async existsByExternalIdAndWallet(
    context: ApplicationContext,
    externalId: string,
    walletId: string,
  ): Promise<boolean> {
    const userId = context.requireUserPrincipal().id;
    const database = resolveDatabaseClient(context, db);
    const rows = await database
      .select({ id: entries.id })
      .from(entries)
      .where(
        and(
          eq(entries.userId, userId),
          eq(entries.walletId, walletId),
          eq(entries.externalId, externalId),
        ),
      )
      .limit(1);

    return rows.length > 0;
  }

  private async insert(
    context: ApplicationContext,
    data: CreateEntryData,
    transferId: string | null = null,
  ) {
    const userId = context.requireUserPrincipal().id;
    const database = resolveDatabaseClient(context, db);

    return database
      .insert(entries)
      .values({
        userId,
        walletId: data.walletId,
        categoryId: data.categoryId,
        transferId,
        nature: data.nature,
        direction: data.direction,
        economicEvent: data.economicEvent,
        amountCents: data.amountCents,
        occurredOn: data.occurredOn,
        description: data.description,
        externalId: data.externalId ?? null,
      })
      .returning({ id: entries.id });
  }

  private async setDeletedAt(
    context: ApplicationContext,
    id: string,
    deletedAt: Date | null,
  ): Promise<Entry> {
    const userId = context.requireUserPrincipal().id;
    const database = resolveDatabaseClient(context, db);
    const [row] = await database
      .update(entries)
      .set({
        deletedAt,
        updatedAt: context.now,
      })
      .where(and(eq(entries.userId, userId), eq(entries.id, id)))
      .returning({ id: entries.id });

    return this.requireEntry(context, row.id);
  }

  private async requireEntry(
    context: ApplicationContext,
    id: string,
  ): Promise<Entry> {
    const entry = await this.findById(context, id);

    if (!entry) {
      throw new Error("Lancamento nao encontrado apos persistencia");
    }

    return entry;
  }
}

const entrySelection = {
  entry: entries,
  walletName: wallets.name,
  categoryName: categories.name,
  categoryColor: categories.color,
  categoryIcon: categories.icon,
};

function listConditions(userId: string, filters: ListEntriesFilters) {
  const conditions = [eq(entries.userId, userId)];

  if (!filters.includeDeleted) {
    conditions.push(isNull(entries.deletedAt));
  }

  if (filters.startDate) {
    conditions.push(gte(entries.occurredOn, filters.startDate));
  }

  if (filters.endDate) {
    conditions.push(lte(entries.occurredOn, filters.endDate));
  }

  if (filters.walletIds?.length) {
    conditions.push(inArray(entries.walletId, [...filters.walletIds]));
  }

  if (filters.categoryIds?.length) {
    conditions.push(inArray(entries.categoryId, [...filters.categoryIds]));
  }

  if (filters.natures?.length) {
    conditions.push(inArray(entries.nature, [...filters.natures]));
  }

  if (filters.economicEvents?.length) {
    conditions.push(inArray(entries.economicEvent, [...filters.economicEvents]));
  }

  return conditions;
}

function mapRowToEntry(row: EntryRow): Entry {
  return {
    id: row.entry.id,
    userId: row.entry.userId,
    legacyId: row.entry.legacyId,
    walletId: row.entry.walletId,
    categoryId: row.entry.categoryId,
    transferId: row.entry.transferId,
    economicEventId: row.entry.economicEventId,
    nature: row.entry.nature,
    direction: row.entry.direction,
    amountCents: row.entry.amountCents,
    occurredOn: row.entry.occurredOn,
    description: row.entry.description,
    externalId: row.entry.externalId,
    economicEvent: row.entry.economicEvent as EconomicEvent | null,
    receiptPath: row.entry.receiptPath,
    deletedAt: row.entry.deletedAt,
    createdAt: row.entry.createdAt,
    updatedAt: row.entry.updatedAt,
    walletName: row.walletName,
    categoryName: row.categoryName,
    categoryColor: row.categoryColor,
    categoryIcon: row.categoryIcon,
  };
}

export const entryRepository = new DrizzleEntryRepository();
