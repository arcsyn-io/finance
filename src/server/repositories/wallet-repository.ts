import "server-only";

import { and, asc, eq } from "drizzle-orm";
import { wallets } from "@/db/schema";
import type { Wallet, WalletType } from "@/domain/wallet/wallet";
import type { ApplicationContext } from "@/server/context/application-context";
import { db } from "@/db/client";
import { resolveDatabaseClient } from "@/server/repositories/database-client";

export type CreateWalletData = {
  readonly name: string;
  readonly type: WalletType;
  readonly initialBalanceCents: number;
  readonly active: boolean;
};

export type UpdateWalletData = {
  readonly name: string;
  readonly type: WalletType;
  readonly initialBalanceCents: number;
  readonly active: boolean;
};

export interface WalletRepository {
  list(
    context: ApplicationContext,
    options: { includeInactive: boolean },
  ): Promise<Wallet[]>;

  findById(context: ApplicationContext, id: string): Promise<Wallet | null>;

  findByName(context: ApplicationContext, name: string): Promise<Wallet | null>;

  create(context: ApplicationContext, data: CreateWalletData): Promise<Wallet>;

  update(
    context: ApplicationContext,
    id: string,
    data: UpdateWalletData,
  ): Promise<Wallet>;

  setActive(
    context: ApplicationContext,
    id: string,
    active: boolean,
  ): Promise<Wallet>;
}

type WalletRow = typeof wallets.$inferSelect;

export class DrizzleWalletRepository implements WalletRepository {
  async list(
    context: ApplicationContext,
    options: { includeInactive: boolean },
  ): Promise<Wallet[]> {
    const userId = context.requireUserPrincipal().id;
    const database = resolveDatabaseClient(context, db);
    const where = options.includeInactive
      ? eq(wallets.userId, userId)
      : and(eq(wallets.userId, userId), eq(wallets.active, true));
    const rows = await database
      .select()
      .from(wallets)
      .where(where)
      .orderBy(asc(wallets.name));

    return rows.map(mapRowToWallet);
  }

  async findById(
    context: ApplicationContext,
    id: string,
  ): Promise<Wallet | null> {
    const userId = context.requireUserPrincipal().id;
    const database = resolveDatabaseClient(context, db);
    const [row] = await database
      .select()
      .from(wallets)
      .where(and(eq(wallets.userId, userId), eq(wallets.id, id)))
      .limit(1);

    return row ? mapRowToWallet(row) : null;
  }

  async findByName(
    context: ApplicationContext,
    name: string,
  ): Promise<Wallet | null> {
    const wallets = await this.list(context, { includeInactive: true });
    const normalizedName = name.toLowerCase();

    return (
      wallets.find((wallet) => wallet.name.toLowerCase() === normalizedName) ??
      null
    );
  }

  async create(
    context: ApplicationContext,
    data: CreateWalletData,
  ): Promise<Wallet> {
    const userId = context.requireUserPrincipal().id;
    const database = resolveDatabaseClient(context, db);
    const [row] = await database
      .insert(wallets)
      .values({
        userId,
        name: data.name,
        type: data.type,
        initialBalanceCents: data.initialBalanceCents,
        active: data.active,
        archivedAt: data.active ? null : context.now,
      })
      .returning();

    return mapRowToWallet(row);
  }

  async update(
    context: ApplicationContext,
    id: string,
    data: UpdateWalletData,
  ): Promise<Wallet> {
    const userId = context.requireUserPrincipal().id;
    const database = resolveDatabaseClient(context, db);
    const [row] = await database
      .update(wallets)
      .set({
        name: data.name,
        type: data.type,
        initialBalanceCents: data.initialBalanceCents,
        active: data.active,
        archivedAt: data.active ? null : context.now,
        updatedAt: context.now,
      })
      .where(and(eq(wallets.userId, userId), eq(wallets.id, id)))
      .returning();

    return mapRowToWallet(row);
  }

  async setActive(
    context: ApplicationContext,
    id: string,
    active: boolean,
  ): Promise<Wallet> {
    const userId = context.requireUserPrincipal().id;
    const database = resolveDatabaseClient(context, db);
    const [row] = await database
      .update(wallets)
      .set({
        active,
        archivedAt: active ? null : context.now,
        updatedAt: context.now,
      })
      .where(and(eq(wallets.userId, userId), eq(wallets.id, id)))
      .returning();

    return mapRowToWallet(row);
  }
}

function mapRowToWallet(row: WalletRow): Wallet {
  return {
    id: row.id,
    userId: row.userId,
    legacyId: row.legacyId,
    name: row.name,
    type: row.type,
    initialBalanceCents: row.initialBalanceCents,
    active: row.active,
    archivedAt: row.archivedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export const walletRepository = new DrizzleWalletRepository();
