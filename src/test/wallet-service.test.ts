import assert from "node:assert/strict";
import test from "node:test";

import type { Wallet } from "../domain/wallet/wallet";
import {
  DuplicateWalletNameError,
  InvalidWalletError,
  WalletNotFoundError,
} from "../domain/wallet/wallet-errors";
import { ApplicationContext } from "../server/context/application-context";
import type {
  CreateWalletData,
  UpdateWalletData,
  WalletRepository,
} from "../server/repositories/wallet-repository";
import { WalletService } from "../server/services/wallet-service";
import type { UnitOfWork } from "../server/unit-of-work/unit-of-work";

class FakeUnitOfWork implements UnitOfWork {
  async execute<T>(
    context: ApplicationContext,
    work: (context: ApplicationContext) => Promise<T>,
  ): Promise<T> {
    return work(context.withTransaction({ client: "tx" }));
  }
}

class FakeWalletRepository implements WalletRepository {
  readonly wallets = new Map<string, Wallet>();
  private nextId = 1;

  async list(
    context: ApplicationContext,
    options: { includeInactive: boolean },
  ): Promise<Wallet[]> {
    const userId = context.requireUserPrincipal().id;

    return [...this.wallets.values()]
      .filter((wallet) => wallet.userId === userId)
      .filter((wallet) => options.includeInactive || wallet.active)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async findById(
    context: ApplicationContext,
    id: string,
  ): Promise<Wallet | null> {
    const userId = context.requireUserPrincipal().id;
    const wallet = this.wallets.get(id);

    return wallet?.userId === userId ? wallet : null;
  }

  async findByName(
    context: ApplicationContext,
    name: string,
  ): Promise<Wallet | null> {
    const userId = context.requireUserPrincipal().id;
    const normalizedName = name.toLowerCase();

    return (
      [...this.wallets.values()].find(
        (wallet) =>
          wallet.userId === userId && wallet.name.toLowerCase() === normalizedName,
      ) ?? null
    );
  }

  async create(
    context: ApplicationContext,
    data: CreateWalletData,
  ): Promise<Wallet> {
    const userId = context.requireUserPrincipal().id;
    const now = context.now;
    const id = String(this.nextId++);
    const wallet: Wallet = {
      id,
      userId,
      legacyId: null,
      name: data.name,
      type: data.type,
      initialBalanceCents: data.initialBalanceCents,
      active: data.active,
      archivedAt: data.active ? null : now,
      createdAt: now,
      updatedAt: now,
    };

    this.wallets.set(id, wallet);

    return wallet;
  }

  async update(
    context: ApplicationContext,
    id: string,
    data: UpdateWalletData,
  ): Promise<Wallet> {
    const existing = await this.findById(context, id);

    if (!existing) {
      throw new WalletNotFoundError();
    }

    const updated: Wallet = {
      ...existing,
      name: data.name,
      type: data.type,
      initialBalanceCents: data.initialBalanceCents,
      active: data.active,
      archivedAt: data.active ? null : context.now,
      updatedAt: context.now,
    };

    this.wallets.set(id, updated);

    return updated;
  }

  async setActive(
    context: ApplicationContext,
    id: string,
    active: boolean,
  ): Promise<Wallet> {
    const existing = await this.findById(context, id);

    if (!existing) {
      throw new WalletNotFoundError();
    }

    const updated: Wallet = {
      ...existing,
      active,
      archivedAt: active ? null : context.now,
      updatedAt: context.now,
    };

    this.wallets.set(id, updated);

    return updated;
  }
}

function makeService(repository = new FakeWalletRepository()) {
  return {
    repository,
    service: new WalletService({
      repository,
      unitOfWork: new FakeUnitOfWork(),
    }),
  };
}

function makeContext(userId = "user-1") {
  return ApplicationContext.user({
    principalId: userId,
    now: new Date("2026-07-09T12:00:00.000Z"),
  });
}

test("cria carteira normalizando nome e saldo inicial padrao", async () => {
  const { service } = makeService();
  const wallet = await service.create(makeContext(), {
    name: "  Nubank  ",
    type: "CASH",
  });

  assert.equal(wallet.name, "Nubank");
  assert.equal(wallet.type, "CASH");
  assert.equal(wallet.initialBalanceCents, 0);
  assert.equal(wallet.active, true);
});

test("aceita saldo inicial em centavos e status inicial", async () => {
  const { service } = makeService();
  const wallet = await service.create(makeContext(), {
    name: "Cartao",
    type: "CREDIT_CARD",
    initialBalanceCents: -1200,
    active: false,
  });

  assert.equal(wallet.initialBalanceCents, -1200);
  assert.equal(wallet.active, false);
  assert.equal(wallet.archivedAt?.toISOString(), "2026-07-09T12:00:00.000Z");
});

test("rejeita carteira sem nome ou tipo", async () => {
  const { service } = makeService();

  await assert.rejects(
    () => service.create(makeContext(), { name: " ", type: "CASH" }),
    InvalidWalletError,
  );

  await assert.rejects(
    () => service.create(makeContext(), { name: "Nubank", type: undefined }),
    InvalidWalletError,
  );
});

test("rejeita nome duplicado de forma case-insensitive por usuario", async () => {
  const { service } = makeService();
  const context = makeContext();

  await service.create(context, { name: "Nubank", type: "CASH" });

  await assert.rejects(
    () => service.create(context, { name: "nubank", type: "CASH" }),
    DuplicateWalletNameError,
  );
});

test("atualiza carteira ignorando duplicidade do proprio registro", async () => {
  const { service } = makeService();
  const context = makeContext();
  const wallet = await service.create(context, { name: "Nubank", type: "CASH" });

  const updated = await service.update(context, {
    id: wallet.id,
    name: " Nubank ",
    type: "NEGOTIABLE_SECURITY",
    initialBalanceCents: 5000,
    active: false,
  });

  assert.equal(updated.name, "Nubank");
  assert.equal(updated.type, "NEGOTIABLE_SECURITY");
  assert.equal(updated.initialBalanceCents, 5000);
  assert.equal(updated.active, false);
});

test("lista carteiras ativas por padrao e todas quando solicitado", async () => {
  const { service } = makeService();
  const context = makeContext();
  const active = await service.create(context, { name: "Conta", type: "CASH" });
  const inactive = await service.create(context, {
    name: "Antiga",
    type: "CASH",
  });
  await service.deactivate(context, { id: inactive.id });

  assert.deepEqual(
    (await service.list(context, { includeInactive: false })).map(
      (wallet) => wallet.id,
    ),
    [active.id],
  );

  assert.deepEqual(
    (await service.list(context, { includeInactive: true })).map(
      (wallet) => wallet.name,
    ),
    ["Antiga", "Conta"],
  );
});

test("ativa e desativa carteira existente", async () => {
  const { service } = makeService();
  const context = makeContext();
  const wallet = await service.create(context, { name: "Nubank", type: "CASH" });

  const inactive = await service.deactivate(context, { id: wallet.id });
  const active = await service.activate(context, { id: wallet.id });

  assert.equal(inactive.active, false);
  assert.equal(active.active, true);
});

test("falha ao ativar carteira inexistente", async () => {
  const { service } = makeService();

  await assert.rejects(
    () => service.activate(makeContext(), { id: "missing" }),
    WalletNotFoundError,
  );
});
