import assert from "node:assert/strict";
import test from "node:test";

import type { Category } from "../domain/category/category";
import type { Entry } from "../domain/entry/entry";
import type { ImportSuggestionHistoryEntry } from "../domain/import/import-suggestion";
import type { Transfer } from "../domain/transfer/transfer";
import {
  EntryNotFoundError,
  InvalidEntryError,
} from "../domain/entry/entry-errors";
import type { Wallet } from "../domain/wallet/wallet";
import { ApplicationContext } from "../server/context/application-context";
import type {
  CreateEntryData,
  CreateTransferEntryData,
  EntryExternalId,
  EntryRepository,
  ListEntriesFilters,
  UpdateEntryData,
} from "../server/repositories/entry-repository";
import type { CategoryRepository } from "../server/repositories/category-repository";
import type { WalletRepository } from "../server/repositories/wallet-repository";
import type {
  CreateTransferData,
  TransferRepository,
} from "../server/repositories/transfer-repository";
import { EntryService } from "../server/services/entry-service";
import type { UnitOfWork } from "../server/unit-of-work/unit-of-work";

class FakeUnitOfWork implements UnitOfWork {
  async execute<T>(
    context: ApplicationContext,
    work: (context: ApplicationContext) => Promise<T>,
  ): Promise<T> {
    return work(context.withTransaction({ client: "tx" }));
  }
}

class FakeEntryRepository implements EntryRepository {
  readonly entries = new Map<string, Entry>();
  private nextId = 1;

  async list(
    context: ApplicationContext,
    filters: ListEntriesFilters,
  ): Promise<Entry[]> {
    const userId = context.requireUserPrincipal().id;

    return [...this.entries.values()]
      .filter((entry) => entry.userId === userId)
      .filter((entry) => filters.includeDeleted || !entry.deletedAt)
      .sort((a, b) => b.occurredOn.localeCompare(a.occurredOn));
  }

  async findById(
    context: ApplicationContext,
    id: string,
  ): Promise<Entry | null> {
    const userId = context.requireUserPrincipal().id;
    const entry = this.entries.get(id);

    return entry?.userId === userId ? entry : null;
  }

  async findByTransferId(
    context: ApplicationContext,
    transferId: string,
  ): Promise<Entry[]> {
    const userId = context.requireUserPrincipal().id;

    return [...this.entries.values()].filter(
      (entry) => entry.userId === userId && entry.transferId === transferId,
    );
  }

  async listSuggestionHistory(): Promise<ImportSuggestionHistoryEntry[]> {
    return [];
  }

  async create(
    context: ApplicationContext,
    data: CreateEntryData,
  ): Promise<Entry> {
    const now = context.now;
    const id = String(this.nextId++);
    const entry: Entry = {
      ...data,
      id,
      userId: context.requireUserPrincipal().id,
      legacyId: null,
      transferId: null,
      economicEventId: null,
      externalId: data.externalId ?? null,
      receiptPath: null,
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
      walletName: null,
      categoryName: null,
      categoryColor: null,
      categoryIcon: null,
    };

    this.entries.set(id, entry);

    return entry;
  }

  async createMany(
    context: ApplicationContext,
    data: Parameters<EntryRepository["createMany"]>[1],
  ) {
    const entries = await Promise.all(
      data.map((entry) => this.create(context, entry)),
    );
    return entries.map(({ id }) => ({ id }));
  }

  async createWithTransfer(
    context: ApplicationContext,
    data: CreateTransferEntryData,
  ): Promise<Entry> {
    const entry = await this.create(context, data);
    const linked = {
      ...entry,
      transferId: data.transferId,
      economicEvent: "TRANSFER" as const,
    };

    this.entries.set(entry.id, linked);

    return linked;
  }

  async update(
    context: ApplicationContext,
    id: string,
    data: UpdateEntryData,
  ): Promise<Entry> {
    const existing = await this.findById(context, id);

    if (!existing) {
      throw new EntryNotFoundError();
    }

    const updated: Entry = {
      ...existing,
      ...data,
      updatedAt: context.now,
    };

    this.entries.set(id, updated);

    return updated;
  }

  async softDelete(
    context: ApplicationContext,
    id: string,
  ): Promise<Entry> {
    const existing = await this.findById(context, id);

    if (!existing) {
      throw new EntryNotFoundError();
    }

    const deleted = {
      ...existing,
      deletedAt: context.now,
      updatedAt: context.now,
    };
    this.entries.set(id, deleted);

    return deleted;
  }

  async restore(
    context: ApplicationContext,
    id: string,
  ): Promise<Entry> {
    const existing = await this.findById(context, id);

    if (!existing) {
      throw new EntryNotFoundError();
    }

    const restored = {
      ...existing,
      deletedAt: null,
      updatedAt: context.now,
    };
    this.entries.set(id, restored);

    return restored;
  }

  async setTransferId(
    context: ApplicationContext,
    id: string,
    transferId: string,
  ): Promise<Entry> {
    const existing = await this.findById(context, id);

    if (!existing) {
      throw new EntryNotFoundError();
    }

    const linked = {
      ...existing,
      transferId,
      economicEvent: "TRANSFER" as const,
      updatedAt: context.now,
    };
    this.entries.set(id, linked);

    return linked;
  }

  async clearTransferId(
    context: ApplicationContext,
    id: string,
  ): Promise<Entry> {
    const existing = await this.findById(context, id);

    if (!existing) {
      throw new EntryNotFoundError();
    }

    const unlinked = {
      ...existing,
      transferId: null,
      economicEvent: null,
      updatedAt: context.now,
    };
    this.entries.set(id, unlinked);

    return unlinked;
  }

  async existsByExternalIdAndWallet(
    context: ApplicationContext,
    externalId: string,
    walletId: string,
  ): Promise<boolean> {
    const userId = context.requireUserPrincipal().id;

    return [...this.entries.values()].some(
      (entry) =>
        entry.userId === userId &&
        entry.externalId === externalId &&
        entry.walletId === walletId,
    );
  }

  async findExistingExternalIds(
    context: ApplicationContext,
    candidates: readonly EntryExternalId[],
  ): Promise<EntryExternalId[]> {
    const userId = context.requireUserPrincipal().id;
    return candidates.filter((candidate) =>
      [...this.entries.values()].some(
        (entry) =>
          entry.userId === userId &&
          entry.walletId === candidate.walletId &&
          entry.externalId === candidate.externalId,
      ),
    );
  }
}

class FakeTransferRepository implements TransferRepository {
  readonly transfers = new Map<string, Transfer>();
  private nextId = 1;

  async create(
    context: ApplicationContext,
    data: CreateTransferData,
  ): Promise<Transfer> {
    const id = `transfer-${this.nextId++}`;
    const transfer: Transfer = {
      ...data,
      id,
      userId: context.requireUserPrincipal().id,
      legacyId: null,
      createdAt: context.now,
      updatedAt: context.now,
    };
    this.transfers.set(id, transfer);

    return transfer;
  }

  async delete(_context: ApplicationContext, id: string): Promise<void> {
    this.transfers.delete(id);
  }
}

class FakeWalletRepository implements Pick<WalletRepository, "findById"> {
  readonly wallets = new Map<string, Wallet>();

  async findById(
    context: ApplicationContext,
    id: string,
  ): Promise<Wallet | null> {
    const wallet = this.wallets.get(id);
    return wallet?.userId === context.requireUserPrincipal().id ? wallet : null;
  }
}

class FakeCategoryRepository implements Pick<CategoryRepository, "findById"> {
  readonly categories = new Map<string, Category>();

  async findById(
    context: ApplicationContext,
    id: string,
  ): Promise<Category | null> {
    const category = this.categories.get(id);
    return category?.userId === context.requireUserPrincipal().id
      ? category
      : null;
  }
}

function makeContext() {
  return ApplicationContext.user({
    principalId: "user-1",
    now: new Date("2026-07-10T12:00:00.000Z"),
  });
}

function makeService() {
  const context = makeContext();
  const entryRepository = new FakeEntryRepository();
  const transferRepository = new FakeTransferRepository();
  const walletRepository = new FakeWalletRepository();
  const categoryRepository = new FakeCategoryRepository();

  walletRepository.wallets.set("wallet-cash", makeWallet(context, "wallet-cash", true, "CASH"));
  walletRepository.wallets.set("wallet-stock", makeWallet(context, "wallet-stock", true, "NEGOTIABLE_SECURITY"));
  walletRepository.wallets.set("wallet-inactive", makeWallet(context, "wallet-inactive", false, "CASH"));
  categoryRepository.categories.set("cat-income", makeCategory(context, "cat-income", "INCOME"));
  categoryRepository.categories.set("cat-expense", makeCategory(context, "cat-expense", "EXPENSE"));

  const service = new EntryService({
    repository: entryRepository,
    transferRepository,
    walletRepository: walletRepository as unknown as WalletRepository,
    categoryRepository: categoryRepository as unknown as CategoryRepository,
    unitOfWork: new FakeUnitOfWork(),
  });

  return { context, entryRepository, service, transferRepository };
}

function makeWallet(
  context: ApplicationContext,
  id: string,
  active: boolean,
  type: Wallet["type"],
): Wallet {
  return {
    id,
    userId: context.requireUserPrincipal().id,
    legacyId: null,
    name: id,
    type,
    initialBalanceCents: 0,
    active,
    archivedAt: active ? null : context.now,
    createdAt: context.now,
    updatedAt: context.now,
  };
}

function makeCategory(
  context: ApplicationContext,
  id: string,
  type: Category["type"],
): Category {
  return {
    id,
    userId: context.requireUserPrincipal().id,
    legacyId: null,
    name: id,
    type,
    icon: "Tag",
    color: "oklch(0.68 0.018 250)",
    active: true,
    archivedAt: null,
    createdAt: context.now,
    updatedAt: context.now,
  };
}

test("cria lancamento inferindo direcao pela categoria e evento padrao", async () => {
  const { context, service } = makeService();

  const entry = await service.create(context, {
    walletId: "wallet-cash",
    categoryId: "cat-expense",
    nature: "OPERATIONAL",
    amountCents: 12345,
    occurredOn: "2026-07-10",
    description: "Pagamento fornecedor",
  });

  assert.equal(entry.direction, "OUT");
  assert.equal(entry.economicEvent, "LIQUIDATION");
  assert.equal(entry.amountCents, 12345);
  assert.equal(entry.description, "Pagamento fornecedor");
});

test("cria receita com direcao IN e evento informado", async () => {
  const { context, service } = makeService();

  const entry = await service.create(context, {
    walletId: "wallet-cash",
    categoryId: "cat-income",
    nature: "OPERATIONAL",
    economicEvent: "INCOME",
    amountCents: 50000,
    occurredOn: "2026-07-10",
  });

  assert.equal(entry.direction, "IN");
  assert.equal(entry.economicEvent, "INCOME");
});

test("cria lancamento com valor zerado", async () => {
  const { context, service } = makeService();

  const entry = await service.create(context, {
    walletId: "wallet-cash",
    categoryId: "cat-expense",
    nature: "OPERATIONAL",
    amountCents: 0,
    occurredOn: "2026-07-10",
    description: "Fatura de agua sem cobranca",
  });

  assert.equal(entry.amountCents, 0);
  assert.equal(entry.description, "Fatura de agua sem cobranca");
});

test("rejeita valor negativo e carteira inativa", async () => {
  const { context, service } = makeService();

  await assert.rejects(
    () =>
      service.create(context, {
        walletId: "wallet-cash",
        categoryId: "cat-expense",
        nature: "OPERATIONAL",
        amountCents: -1,
        occurredOn: "2026-07-10",
      }),
    InvalidEntryError,
  );

  await assert.rejects(
    () =>
      service.create(context, {
        walletId: "wallet-inactive",
        categoryId: "cat-expense",
        nature: "OPERATIONAL",
        amountCents: 100,
        occurredOn: "2026-07-10",
      }),
    InvalidEntryError,
  );
});

test("atualiza lancamento recalculando direcao e mantendo soft delete", async () => {
  const { context, service } = makeService();
  const entry = await service.create(context, {
    walletId: "wallet-cash",
    categoryId: "cat-expense",
    nature: "OPERATIONAL",
    amountCents: 1000,
    occurredOn: "2026-07-10",
  });

  const updated = await service.update(context, {
    id: entry.id,
    walletId: "wallet-cash",
    categoryId: "cat-income",
    nature: "PATRIMONIAL",
    amountCents: 2000,
    occurredOn: "2026-07-11",
    description: "Correcao",
  });

  assert.equal(updated.direction, "IN");
  assert.equal(updated.nature, "PATRIMONIAL");
  assert.equal(updated.description, "Correcao");
});

test("exclui e restaura lancamento sem delete fisico", async () => {
  const { context, service } = makeService();
  const entry = await service.create(context, {
    walletId: "wallet-cash",
    categoryId: "cat-expense",
    nature: "OPERATIONAL",
    amountCents: 1000,
    occurredOn: "2026-07-10",
  });

  const deleted = await service.delete(context, { id: entry.id });
  const restored = await service.restore(context, { id: entry.id });

  assert.ok(deleted.deletedAt);
  assert.equal(restored.deletedAt, null);
});

test("vincula dois lancamentos existentes como transferencia", async () => {
  const { context, service, transferRepository } = makeService();
  const outEntry = await service.create(context, {
    walletId: "wallet-cash",
    categoryId: "cat-expense",
    nature: "OPERATIONAL",
    amountCents: 15000,
    occurredOn: "2026-07-09",
    description: "Envio para reserva",
  });
  const inEntry = await service.create(context, {
    walletId: "wallet-stock",
    categoryId: "cat-income",
    nature: "PATRIMONIAL",
    amountCents: 15000,
    occurredOn: "2026-07-10",
    description: "Reserva recebida",
  });

  const linked = await service.linkTransfer(context, {
    mode: "existing",
    sourceEntryId: outEntry.id,
    targetEntryId: inEntry.id,
  });

  const transfer = transferRepository.transfers.get(linked.transferId);
  assert.ok(transfer);
  assert.equal(transfer.fromWalletId, "wallet-cash");
  assert.equal(transfer.toWalletId, "wallet-stock");
  assert.equal(transfer.occurredOn, "2026-07-10");
  assert.equal(linked.entries.length, 2);
  assert.ok(linked.entries.every((entry) => entry.transferId === linked.transferId));
  assert.ok(linked.entries.every((entry) => entry.economicEvent === "TRANSFER"));
});

test("cria contraparte e vincula como transferencia", async () => {
  const { context, service } = makeService();
  const source = await service.create(context, {
    walletId: "wallet-cash",
    categoryId: "cat-expense",
    nature: "OPERATIONAL",
    amountCents: 4200,
    occurredOn: "2026-07-10",
    description: "Transferencia para investimentos",
  });

  const linked = await service.linkTransfer(context, {
    mode: "create",
    sourceEntryId: source.id,
    walletId: "wallet-stock",
    categoryId: "cat-income",
    nature: "PATRIMONIAL",
    description: "Entrada em investimentos",
  });

  const target = linked.entries.find((entry) => entry.id !== source.id);
  assert.ok(target);
  assert.equal(target.walletId, "wallet-stock");
  assert.equal(target.direction, "IN");
  assert.equal(target.amountCents, source.amountCents);
  assert.equal(target.occurredOn, source.occurredOn);
  assert.equal(target.transferId, linked.transferId);
});

test("desvincula transferencia mantendo os lancamentos", async () => {
  const { context, service, transferRepository } = makeService();
  const source = await service.create(context, {
    walletId: "wallet-cash",
    categoryId: "cat-expense",
    nature: "OPERATIONAL",
    amountCents: 7500,
    occurredOn: "2026-07-10",
  });
  const linked = await service.linkTransfer(context, {
    mode: "create",
    sourceEntryId: source.id,
    walletId: "wallet-stock",
    categoryId: "cat-income",
    nature: "PATRIMONIAL",
    description: "Entrada vinculada",
  });

  const unlinked = await service.unlinkTransfer(context, {
    entryId: source.id,
  });

  assert.equal(unlinked.transferId, linked.transferId);
  assert.equal(transferRepository.transfers.has(linked.transferId), false);
  assert.equal(unlinked.entries.length, 2);
  assert.ok(unlinked.entries.every((entry) => entry.transferId === null));
  assert.ok(unlinked.entries.every((entry) => entry.economicEvent === null));
});

test("rejeita transferencia com mesma carteira ou mesmo valor diferente", async () => {
  const { context, service } = makeService();
  const source = await service.create(context, {
    walletId: "wallet-cash",
    categoryId: "cat-expense",
    nature: "OPERATIONAL",
    amountCents: 1000,
    occurredOn: "2026-07-10",
  });
  const sameWalletTarget = await service.create(context, {
    walletId: "wallet-cash",
    categoryId: "cat-income",
    nature: "OPERATIONAL",
    amountCents: 1000,
    occurredOn: "2026-07-10",
  });

  await assert.rejects(
    () =>
      service.linkTransfer(context, {
        mode: "existing",
        sourceEntryId: source.id,
        targetEntryId: sameWalletTarget.id,
      }),
    InvalidEntryError,
  );

  await assert.rejects(
    () =>
      service.linkTransfer(context, {
        mode: "create",
        sourceEntryId: source.id,
        walletId: "wallet-stock",
        categoryId: "cat-expense",
        nature: "PATRIMONIAL",
      }),
    InvalidEntryError,
  );
});
