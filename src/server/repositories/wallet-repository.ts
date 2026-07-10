import type { Wallet, WalletType } from "@/domain/wallet/wallet";
import type { ApplicationContext } from "@/server/context/application-context";
import { createClient } from "@/lib/supabase/server";

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

type WalletRow = {
  id: string;
  user_id: string;
  legacy_id: number | null;
  name: string;
  type: WalletType;
  initial_balance_cents: number;
  active: boolean;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
};

export class SupabaseWalletRepository implements WalletRepository {
  async list(
    context: ApplicationContext,
    options: { includeInactive: boolean },
  ): Promise<Wallet[]> {
    const userId = context.requireUserPrincipal().id;
    const supabase = await createClient();
    let query = supabase
      .from("wallets")
      .select("*")
      .eq("user_id", userId)
      .order("name", { ascending: true });

    if (!options.includeInactive) {
      query = query.eq("active", true);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return (data as WalletRow[]).map(mapRowToWallet);
  }

  async findById(
    context: ApplicationContext,
    id: string,
  ): Promise<Wallet | null> {
    const userId = context.requireUserPrincipal().id;
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("wallets")
      .select("*")
      .eq("user_id", userId)
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data ? mapRowToWallet(data as WalletRow) : null;
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
    const supabase = await createClient();
    const { data: row, error } = await supabase
      .from("wallets")
      .insert({
        user_id: userId,
        name: data.name,
        type: data.type,
        initial_balance_cents: data.initialBalanceCents,
        active: data.active,
        archived_at: data.active ? null : context.now.toISOString(),
      })
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return mapRowToWallet(row as WalletRow);
  }

  async update(
    context: ApplicationContext,
    id: string,
    data: UpdateWalletData,
  ): Promise<Wallet> {
    const userId = context.requireUserPrincipal().id;
    const supabase = await createClient();
    const { data: row, error } = await supabase
      .from("wallets")
      .update({
        name: data.name,
        type: data.type,
        initial_balance_cents: data.initialBalanceCents,
        active: data.active,
        archived_at: data.active ? null : context.now.toISOString(),
        updated_at: context.now.toISOString(),
      })
      .eq("user_id", userId)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return mapRowToWallet(row as WalletRow);
  }

  async setActive(
    context: ApplicationContext,
    id: string,
    active: boolean,
  ): Promise<Wallet> {
    const userId = context.requireUserPrincipal().id;
    const supabase = await createClient();
    const { data: row, error } = await supabase
      .from("wallets")
      .update({
        active,
        archived_at: active ? null : context.now.toISOString(),
        updated_at: context.now.toISOString(),
      })
      .eq("user_id", userId)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return mapRowToWallet(row as WalletRow);
  }
}

function mapRowToWallet(row: WalletRow): Wallet {
  return {
    id: row.id,
    userId: row.user_id,
    legacyId: row.legacy_id,
    name: row.name,
    type: row.type,
    initialBalanceCents: row.initial_balance_cents,
    active: row.active,
    archivedAt: row.archived_at ? new Date(row.archived_at) : null,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export const walletRepository = new SupabaseWalletRepository();
