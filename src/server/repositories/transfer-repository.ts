import "server-only";

import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { transfers } from "@/db/schema";
import type { Transfer } from "@/domain/transfer/transfer";
import type { ApplicationContext } from "@/server/context/application-context";
import { resolveDatabaseClient } from "@/server/repositories/database-client";

export type CreateTransferData = {
  readonly fromWalletId: string;
  readonly toWalletId: string;
  readonly fromCategoryId: string;
  readonly toCategoryId: string;
  readonly amountCents: number;
  readonly occurredOn: string;
  readonly description: string | null;
};

export interface TransferRepository {
  create(context: ApplicationContext, data: CreateTransferData): Promise<Transfer>;

  delete(context: ApplicationContext, id: string): Promise<void>;
}

type TransferRow = typeof transfers.$inferSelect;

export class DrizzleTransferRepository implements TransferRepository {
  async create(
    context: ApplicationContext,
    data: CreateTransferData,
  ): Promise<Transfer> {
    const userId = context.requireUserPrincipal().id;
    const database = resolveDatabaseClient(context, db);
    const [row] = await database
      .insert(transfers)
      .values({
        userId,
        fromWalletId: data.fromWalletId,
        toWalletId: data.toWalletId,
        fromCategoryId: data.fromCategoryId,
        toCategoryId: data.toCategoryId,
        amountCents: data.amountCents,
        occurredOn: data.occurredOn,
        description: data.description,
      })
      .returning();

    return mapRowToTransfer(row);
  }

  async delete(context: ApplicationContext, id: string): Promise<void> {
    const userId = context.requireUserPrincipal().id;
    const database = resolveDatabaseClient(context, db);
    await database
      .delete(transfers)
      .where(and(eq(transfers.userId, userId), eq(transfers.id, id)));
  }
}

function mapRowToTransfer(row: TransferRow): Transfer {
  return {
    id: row.id,
    userId: row.userId,
    legacyId: row.legacyId,
    fromWalletId: row.fromWalletId,
    toWalletId: row.toWalletId,
    fromCategoryId: row.fromCategoryId,
    toCategoryId: row.toCategoryId,
    amountCents: row.amountCents,
    occurredOn: row.occurredOn,
    description: row.description,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export const transferRepository = new DrizzleTransferRepository();
