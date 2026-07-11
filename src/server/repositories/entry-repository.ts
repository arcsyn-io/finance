import type {
  EconomicEvent,
  Entry,
  EntryDirection,
  EntryNature,
} from "@/domain/entry/entry";
import { createClient } from "@/lib/supabase/server";
import type { ApplicationContext } from "@/server/context/application-context";

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
}

type EntryRow = {
  id: string;
  user_id: string;
  legacy_id: number | null;
  wallet_id: string;
  category_id: string | null;
  transfer_id: string | null;
  economic_event_id: string | null;
  nature: EntryNature;
  direction: EntryDirection;
  amount_cents: number;
  occurred_on: string;
  description: string | null;
  external_id: string | null;
  economic_event: EconomicEvent | null;
  receipt_path: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  wallets?: { name: string } | null;
  categories?: { name: string; color: string | null; icon: string | null } | null;
};

const entrySelect =
  "*, wallets(name), categories(name, color, icon)";

export class SupabaseEntryRepository implements EntryRepository {
  async list(
    context: ApplicationContext,
    filters: ListEntriesFilters,
  ): Promise<Entry[]> {
    const userId = context.requireUserPrincipal().id;
    const supabase = await createClient();
    let query = supabase
      .from("entries")
      .select(entrySelect)
      .eq("user_id", userId)
      .order("occurred_on", { ascending: false })
      .order("created_at", { ascending: false });

    if (!filters.includeDeleted) {
      query = query.is("deleted_at", null);
    }

    if (filters.startDate) {
      query = query.gte("occurred_on", filters.startDate);
    }

    if (filters.endDate) {
      query = query.lte("occurred_on", filters.endDate);
    }

    if (filters.walletIds?.length) {
      query = query.in("wallet_id", [...filters.walletIds]);
    }

    if (filters.categoryIds?.length) {
      query = query.in("category_id", [...filters.categoryIds]);
    }

    if (filters.natures?.length) {
      query = query.in("nature", [...filters.natures]);
    }

    if (filters.economicEvents?.length) {
      query = query.in("economic_event", [...filters.economicEvents]);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return (data as EntryRow[]).map(mapRowToEntry);
  }

  async findById(
    context: ApplicationContext,
    id: string,
  ): Promise<Entry | null> {
    const userId = context.requireUserPrincipal().id;
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("entries")
      .select(entrySelect)
      .eq("user_id", userId)
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data ? mapRowToEntry(data as EntryRow) : null;
  }

  async findByTransferId(
    context: ApplicationContext,
    transferId: string,
  ): Promise<Entry[]> {
    const userId = context.requireUserPrincipal().id;
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("entries")
      .select(entrySelect)
      .eq("user_id", userId)
      .eq("transfer_id", transferId)
      .order("occurred_on", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return (data as EntryRow[]).map(mapRowToEntry);
  }

  async create(
    context: ApplicationContext,
    data: CreateEntryData,
  ): Promise<Entry> {
    const userId = context.requireUserPrincipal().id;
    const supabase = await createClient();
    const { data: row, error } = await supabase
      .from("entries")
      .insert({
        user_id: userId,
        wallet_id: data.walletId,
        category_id: data.categoryId,
        nature: data.nature,
        direction: data.direction,
        economic_event: data.economicEvent,
        amount_cents: data.amountCents,
        occurred_on: data.occurredOn,
        description: data.description,
      })
      .select(entrySelect)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return mapRowToEntry(row as EntryRow);
  }

  async createWithTransfer(
    context: ApplicationContext,
    data: CreateTransferEntryData,
  ): Promise<Entry> {
    const userId = context.requireUserPrincipal().id;
    const supabase = await createClient();
    const { data: row, error } = await supabase
      .from("entries")
      .insert({
        user_id: userId,
        wallet_id: data.walletId,
        category_id: data.categoryId,
        transfer_id: data.transferId,
        nature: data.nature,
        direction: data.direction,
        economic_event: data.economicEvent,
        amount_cents: data.amountCents,
        occurred_on: data.occurredOn,
        description: data.description,
      })
      .select(entrySelect)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return mapRowToEntry(row as EntryRow);
  }

  async update(
    context: ApplicationContext,
    id: string,
    data: UpdateEntryData,
  ): Promise<Entry> {
    const userId = context.requireUserPrincipal().id;
    const supabase = await createClient();
    const { data: row, error } = await supabase
      .from("entries")
      .update({
        wallet_id: data.walletId,
        category_id: data.categoryId,
        nature: data.nature,
        direction: data.direction,
        economic_event: data.economicEvent,
        amount_cents: data.amountCents,
        occurred_on: data.occurredOn,
        description: data.description,
        updated_at: context.now.toISOString(),
      })
      .eq("user_id", userId)
      .eq("id", id)
      .select(entrySelect)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return mapRowToEntry(row as EntryRow);
  }

  async softDelete(
    context: ApplicationContext,
    id: string,
  ): Promise<Entry> {
    return this.setDeletedAt(context, id, context.now.toISOString());
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
    const supabase = await createClient();
    const { data: row, error } = await supabase
      .from("entries")
      .update({
        transfer_id: transferId,
        economic_event: "TRANSFER",
        updated_at: context.now.toISOString(),
      })
      .eq("user_id", userId)
      .eq("id", id)
      .select(entrySelect)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return mapRowToEntry(row as EntryRow);
  }

  async clearTransferId(
    context: ApplicationContext,
    id: string,
  ): Promise<Entry> {
    const userId = context.requireUserPrincipal().id;
    const supabase = await createClient();
    const { data: row, error } = await supabase
      .from("entries")
      .update({
        transfer_id: null,
        economic_event: null,
        updated_at: context.now.toISOString(),
      })
      .eq("user_id", userId)
      .eq("id", id)
      .select(entrySelect)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return mapRowToEntry(row as EntryRow);
  }

  private async setDeletedAt(
    context: ApplicationContext,
    id: string,
    deletedAt: string | null,
  ): Promise<Entry> {
    const userId = context.requireUserPrincipal().id;
    const supabase = await createClient();
    const { data: row, error } = await supabase
      .from("entries")
      .update({
        deleted_at: deletedAt,
        updated_at: context.now.toISOString(),
      })
      .eq("user_id", userId)
      .eq("id", id)
      .select(entrySelect)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return mapRowToEntry(row as EntryRow);
  }
}

function mapRowToEntry(row: EntryRow): Entry {
  return {
    id: row.id,
    userId: row.user_id,
    legacyId: row.legacy_id,
    walletId: row.wallet_id,
    categoryId: row.category_id,
    transferId: row.transfer_id,
    economicEventId: row.economic_event_id,
    nature: row.nature,
    direction: row.direction,
    amountCents: row.amount_cents,
    occurredOn: row.occurred_on,
    description: row.description,
    externalId: row.external_id,
    economicEvent: row.economic_event,
    receiptPath: row.receipt_path,
    deletedAt: row.deleted_at ? new Date(row.deleted_at) : null,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    walletName: row.wallets?.name ?? null,
    categoryName: row.categories?.name ?? null,
    categoryColor: row.categories?.color ?? null,
    categoryIcon: row.categories?.icon ?? null,
  };
}

export const entryRepository = new SupabaseEntryRepository();
