import "server-only";

import { and, asc, desc, eq, ne } from "drizzle-orm";
import { db } from "@/db/client";
import {
  categories,
  importRequests,
  importRows,
  wallets,
} from "@/db/schema";
import type {
  EconomicEvent,
  EntryDirection,
  EntryNature,
} from "@/domain/entry/entry";
import type {
  ImportRequest,
  ImportRow,
  ImportSource,
  ImportStatus,
  ParsedImportRow,
} from "@/domain/import/import";
import type { ApplicationContext } from "@/server/context/application-context";
import { resolveDatabaseClient } from "@/server/repositories/database-client";

export type CreateImportRequestData = {
  readonly source: ImportSource;
  readonly fileName: string;
  readonly defaultWalletId: string | null;
  readonly defaultCategoryId: string | null;
  readonly nature: EntryNature | null;
  readonly economicEvent: EconomicEvent | null;
};

export type UpdateImportRowData = {
  readonly description: string;
  readonly occurredOn: string;
  readonly amountCents: number;
  readonly walletId: string | null;
  readonly categoryId: string | null;
  readonly nature: EntryNature | null;
  readonly economicEvent: EconomicEvent | null;
  readonly valid: boolean;
  readonly validationErrors: string | null;
};

export interface ImportRepository {
  list(
    context: ApplicationContext,
    options: { includeConfirmed: boolean },
  ): Promise<ImportRequest[]>;
  findById(context: ApplicationContext, id: string): Promise<ImportRequest | null>;
  createRequest(
    context: ApplicationContext,
    data: CreateImportRequestData,
  ): Promise<ImportRequest>;
  insertRows(
    context: ApplicationContext,
    requestId: string,
    rows: readonly ParsedImportRow[],
  ): Promise<void>;
  updateRow(
    context: ApplicationContext,
    rowId: string,
    data: UpdateImportRowData,
  ): Promise<ImportRow>;
  setRowIgnored(
    context: ApplicationContext,
    rowId: string,
    ignoredAt: string | null,
  ): Promise<ImportRow>;
  setRowEntryId(
    context: ApplicationContext,
    rowId: string,
    entryId: string,
  ): Promise<void>;
  confirmRequest(context: ApplicationContext, id: string): Promise<void>;
  deleteRequest(context: ApplicationContext, id: string): Promise<void>;
}

type ImportRequestRow = {
  readonly request: typeof importRequests.$inferSelect;
  readonly defaultWalletName: string | null;
  readonly defaultCategoryName: string | null;
};

type ImportRowRow = {
  readonly row: typeof importRows.$inferSelect;
  readonly walletName: string | null;
  readonly categoryName: string | null;
  readonly categoryColor: string | null;
  readonly categoryIcon: string | null;
};

export class DrizzleImportRepository implements ImportRepository {
  async list(
    context: ApplicationContext,
    options: { includeConfirmed: boolean },
  ): Promise<ImportRequest[]> {
    const userId = context.requireUserPrincipal().id;
    const database = resolveDatabaseClient(context, db);
    const where = options.includeConfirmed
      ? eq(importRequests.userId, userId)
      : and(
          eq(importRequests.userId, userId),
          ne(importRequests.status, "CONFIRMED"),
        );
    const rows = await database
      .select(requestSelection)
      .from(importRequests)
      .leftJoin(wallets, eq(importRequests.defaultWalletId, wallets.id))
      .leftJoin(categories, eq(importRequests.defaultCategoryId, categories.id))
      .where(where)
      .orderBy(desc(importRequests.createdAt));

    const requests: ImportRequest[] = [];

    for (const row of rows) {
      requests.push({
        ...mapRequest(row),
        rows: await this.listRows(context, row.request.id),
      });
    }

    return requests;
  }

  async findById(
    context: ApplicationContext,
    id: string,
  ): Promise<ImportRequest | null> {
    const userId = context.requireUserPrincipal().id;
    const database = resolveDatabaseClient(context, db);
    const [row] = await database
      .select(requestSelection)
      .from(importRequests)
      .leftJoin(wallets, eq(importRequests.defaultWalletId, wallets.id))
      .leftJoin(categories, eq(importRequests.defaultCategoryId, categories.id))
      .where(and(eq(importRequests.userId, userId), eq(importRequests.id, id)))
      .limit(1);

    if (!row) return null;

    return {
      ...mapRequest(row),
      rows: await this.listRows(context, id),
    };
  }

  async createRequest(
    context: ApplicationContext,
    data: CreateImportRequestData,
  ): Promise<ImportRequest> {
    const userId = context.requireUserPrincipal().id;
    const database = resolveDatabaseClient(context, db);
    const [row] = await database
      .insert(importRequests)
      .values({
        userId,
        source: data.source,
        status: "PENDING_REVIEW",
        fileName: data.fileName,
        defaultWalletId: data.defaultWalletId,
        defaultCategoryId: data.defaultCategoryId,
        nature: data.nature,
        economicEvent: data.economicEvent,
      })
      .returning({ id: importRequests.id });

    const request = await this.findById(context, row.id);

    if (!request) {
      throw new Error("Importacao nao encontrada apos persistencia");
    }

    return { ...request, rows: [] };
  }

  async insertRows(
    context: ApplicationContext,
    requestId: string,
    rows: readonly ParsedImportRow[],
  ): Promise<void> {
    if (rows.length === 0) {
      return;
    }

    const userId = context.requireUserPrincipal().id;
    const database = resolveDatabaseClient(context, db);
    await database.insert(importRows).values(
      rows.map((row) => ({
        importRequestId: requestId,
        userId,
        rowNumber: row.rowNumber,
        occurredOn: row.occurredOn,
        description: row.description,
        amountCents: row.amountCents,
        direction: row.direction,
        externalId: row.externalId,
        valid: true,
      })),
    );
  }

  async updateRow(
    context: ApplicationContext,
    rowId: string,
    data: UpdateImportRowData,
  ): Promise<ImportRow> {
    const userId = context.requireUserPrincipal().id;
    const database = resolveDatabaseClient(context, db);
    const [row] = await database
      .update(importRows)
      .set({
        description: data.description,
        occurredOn: data.occurredOn,
        amountCents: data.amountCents,
        walletId: data.walletId,
        categoryId: data.categoryId,
        nature: data.nature,
        economicEvent: data.economicEvent,
        valid: data.valid,
        validationErrors: data.validationErrors,
        updatedAt: context.now,
      })
      .where(and(eq(importRows.userId, userId), eq(importRows.id, rowId)))
      .returning({ id: importRows.id });

    return this.requireRow(context, row.id);
  }

  async setRowIgnored(
    context: ApplicationContext,
    rowId: string,
    ignoredAt: string | null,
  ): Promise<ImportRow> {
    const userId = context.requireUserPrincipal().id;
    const database = resolveDatabaseClient(context, db);
    const [row] = await database
      .update(importRows)
      .set({
        ignoredAt: ignoredAt ? new Date(ignoredAt) : null,
        updatedAt: context.now,
      })
      .where(and(eq(importRows.userId, userId), eq(importRows.id, rowId)))
      .returning({ id: importRows.id });

    return this.requireRow(context, row.id);
  }

  async setRowEntryId(
    context: ApplicationContext,
    rowId: string,
    entryId: string,
  ): Promise<void> {
    const userId = context.requireUserPrincipal().id;
    const database = resolveDatabaseClient(context, db);
    await database
      .update(importRows)
      .set({ entryId, updatedAt: context.now })
      .where(and(eq(importRows.userId, userId), eq(importRows.id, rowId)));
  }

  async confirmRequest(
    context: ApplicationContext,
    id: string,
  ): Promise<void> {
    const userId = context.requireUserPrincipal().id;
    const database = resolveDatabaseClient(context, db);
    await database
      .update(importRequests)
      .set({
        status: "CONFIRMED",
        confirmedAt: context.now,
        updatedAt: context.now,
      })
      .where(and(eq(importRequests.userId, userId), eq(importRequests.id, id)));
  }

  async deleteRequest(context: ApplicationContext, id: string): Promise<void> {
    const userId = context.requireUserPrincipal().id;
    const database = resolveDatabaseClient(context, db);
    await database
      .delete(importRequests)
      .where(and(eq(importRequests.userId, userId), eq(importRequests.id, id)));
  }

  private async requireRow(
    context: ApplicationContext,
    id: string,
  ): Promise<ImportRow> {
    const userId = context.requireUserPrincipal().id;
    const database = resolveDatabaseClient(context, db);
    const [row] = await database
      .select(rowSelection)
      .from(importRows)
      .leftJoin(wallets, eq(importRows.walletId, wallets.id))
      .leftJoin(categories, eq(importRows.categoryId, categories.id))
      .where(and(eq(importRows.userId, userId), eq(importRows.id, id)))
      .limit(1);

    if (!row) {
      throw new Error("Linha de importacao nao encontrada apos persistencia");
    }

    return mapRow(row);
  }

  private async listRows(
    context: ApplicationContext,
    requestId: string,
  ): Promise<ImportRow[]> {
    const userId = context.requireUserPrincipal().id;
    const database = resolveDatabaseClient(context, db);
    const rows = await database
      .select(rowSelection)
      .from(importRows)
      .leftJoin(wallets, eq(importRows.walletId, wallets.id))
      .leftJoin(categories, eq(importRows.categoryId, categories.id))
      .where(
        and(
          eq(importRows.userId, userId),
          eq(importRows.importRequestId, requestId),
        ),
      )
      .orderBy(asc(importRows.rowNumber));

    return rows.map(mapRow);
  }
}

const requestSelection = {
  request: importRequests,
  defaultWalletName: wallets.name,
  defaultCategoryName: categories.name,
};

const rowSelection = {
  row: importRows,
  walletName: wallets.name,
  categoryName: categories.name,
  categoryColor: categories.color,
  categoryIcon: categories.icon,
};

function mapRequest(row: ImportRequestRow): Omit<ImportRequest, "rows"> {
  return {
    id: row.request.id,
    userId: row.request.userId,
    source: row.request.source as ImportSource,
    status: row.request.status as ImportStatus,
    fileName: row.request.fileName,
    nature: row.request.nature,
    economicEvent: row.request.economicEvent as EconomicEvent | null,
    confirmedAt: row.request.confirmedAt,
    defaultWalletId: row.request.defaultWalletId,
    defaultWalletName: row.defaultWalletName,
    defaultCategoryId: row.request.defaultCategoryId,
    defaultCategoryName: row.defaultCategoryName,
    createdAt: row.request.createdAt,
    updatedAt: row.request.updatedAt,
  };
}

function mapRow(row: ImportRowRow): ImportRow {
  return {
    id: row.row.id,
    importRequestId: row.row.importRequestId,
    userId: row.row.userId,
    rowNumber: row.row.rowNumber,
    occurredOn: row.row.occurredOn,
    description: row.row.description,
    amountCents: row.row.amountCents,
    direction: row.row.direction as EntryDirection,
    nature: row.row.nature,
    walletId: row.row.walletId,
    walletName: row.walletName,
    categoryId: row.row.categoryId,
    categoryName: row.categoryName,
    categoryColor: row.categoryColor,
    categoryIcon: row.categoryIcon,
    externalId: row.row.externalId,
    valid: row.row.valid,
    validationErrors: row.row.validationErrors,
    economicEvent: row.row.economicEvent as EconomicEvent | null,
    entryId: row.row.entryId,
    ignoredAt: row.row.ignoredAt,
    createdAt: row.row.createdAt,
    updatedAt: row.row.updatedAt,
  };
}

export const importRepository = new DrizzleImportRepository();
