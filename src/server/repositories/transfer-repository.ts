import type { Transfer } from "@/domain/transfer/transfer";
import { createClient } from "@/lib/supabase/server";
import type { ApplicationContext } from "@/server/context/application-context";

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

type TransferRow = {
  id: string;
  user_id: string;
  legacy_id: number | null;
  from_wallet_id: string;
  to_wallet_id: string;
  from_category_id: string | null;
  to_category_id: string | null;
  amount_cents: number;
  occurred_on: string;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export class SupabaseTransferRepository implements TransferRepository {
  async create(
    context: ApplicationContext,
    data: CreateTransferData,
  ): Promise<Transfer> {
    const userId = context.requireUserPrincipal().id;
    const supabase = await createClient();
    const { data: row, error } = await supabase
      .from("transfers")
      .insert({
        user_id: userId,
        from_wallet_id: data.fromWalletId,
        to_wallet_id: data.toWalletId,
        from_category_id: data.fromCategoryId,
        to_category_id: data.toCategoryId,
        amount_cents: data.amountCents,
        occurred_on: data.occurredOn,
        description: data.description,
      })
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return mapRowToTransfer(row as TransferRow);
  }

  async delete(context: ApplicationContext, id: string): Promise<void> {
    const userId = context.requireUserPrincipal().id;
    const supabase = await createClient();
    const { error } = await supabase
      .from("transfers")
      .delete()
      .eq("user_id", userId)
      .eq("id", id);

    if (error) {
      throw new Error(error.message);
    }
  }
}

function mapRowToTransfer(row: TransferRow): Transfer {
  return {
    id: row.id,
    userId: row.user_id,
    legacyId: row.legacy_id,
    fromWalletId: row.from_wallet_id,
    toWalletId: row.to_wallet_id,
    fromCategoryId: row.from_category_id,
    toCategoryId: row.to_category_id,
    amountCents: row.amount_cents,
    occurredOn: row.occurred_on,
    description: row.description,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export const transferRepository = new SupabaseTransferRepository();
