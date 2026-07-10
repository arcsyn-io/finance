import assert from "node:assert/strict";
import test from "node:test";

import type { Wallet } from "../domain/wallet/wallet";
import {
  InvalidWalletError,
  WalletNotFoundError,
} from "../domain/wallet/wallet-errors";
import type {
  CreateWalletCommand,
  SetWalletActiveCommand,
  UpdateWalletCommand,
} from "../server/commands/wallet-commands";
import { ApplicationContext } from "../server/context/application-context";
import {
  createWalletJson,
  setWalletActiveJson,
  updateWalletJson,
} from "../server/controllers/wallet-controller";

class FakeWalletService {
  createCommand: CreateWalletCommand | null = null;
  updateCommand: UpdateWalletCommand | null = null;
  setActiveCommand: SetWalletActiveCommand | null = null;

  async create(
    context: ApplicationContext,
    command: CreateWalletCommand,
  ): Promise<Wallet> {
    this.createCommand = command;
    return makeWallet(context, {
      id: "wallet-1",
      name: command.name,
      type: command.type ?? "CASH",
      initialBalanceCents: command.initialBalanceCents ?? 0,
      active: command.active ?? true,
    });
  }

  async update(
    context: ApplicationContext,
    command: UpdateWalletCommand,
  ): Promise<Wallet> {
    this.updateCommand = command;

    if (command.id === "00000000-0000-0000-0000-000000000404") {
      throw new WalletNotFoundError();
    }

    return makeWallet(context, {
      id: command.id,
      name: command.name,
      type: command.type ?? "CASH",
      initialBalanceCents: command.initialBalanceCents,
      active: command.active,
    });
  }

  async activate(
    context: ApplicationContext,
    command: SetWalletActiveCommand,
  ): Promise<Wallet> {
    this.setActiveCommand = command;
    return makeWallet(context, {
      id: command.id,
      name: "Nubank",
      type: "CASH",
      initialBalanceCents: 0,
      active: true,
    });
  }

  async deactivate(
    context: ApplicationContext,
    command: SetWalletActiveCommand,
  ): Promise<Wallet> {
    this.setActiveCommand = command;
    return makeWallet(context, {
      id: command.id,
      name: "Nubank",
      type: "CASH",
      initialBalanceCents: 0,
      active: false,
    });
  }
}

function makeContext() {
  return ApplicationContext.user({
    principalId: "user-1",
    now: new Date("2026-07-09T12:00:00.000Z"),
  });
}

function makeWallet(
  context: ApplicationContext,
  data: Pick<
    Wallet,
    "active" | "id" | "initialBalanceCents" | "name" | "type"
  >,
): Wallet {
  return {
    ...data,
    userId: context.requireUserPrincipal().id,
    legacyId: null,
    archivedAt: data.active ? null : context.now,
    createdAt: context.now,
    updatedAt: context.now,
  };
}

test("controller cria carteira a partir de JSON valido", async () => {
  const service = new FakeWalletService();
  const response = await createWalletJson({
    context: makeContext(),
    service,
    body: {
      name: "Nubank",
      type: "CASH",
      initialBalanceCents: 12500,
    },
  });

  assert.equal(response.status, 201);
  assert.deepEqual(service.createCommand, {
    name: "Nubank",
    type: "CASH",
    initialBalanceCents: 12500,
    active: undefined,
  });
  assert.equal(response.body.status, "created");
  assert.equal(response.body.wallet?.name, "Nubank");
});

test("controller retorna 400 para tipo invalido", async () => {
  const response = await createWalletJson({
    context: makeContext(),
    service: new FakeWalletService(),
    body: { name: "Nubank", type: "INVALID" },
  });

  assert.equal(response.status, 400);
  assert.equal(response.body.error, "Tipo da carteira e obrigatorio");
});

test("controller retorna 404 para carteira inexistente", async () => {
  const response = await updateWalletJson({
    context: makeContext(),
    service: new FakeWalletService(),
    id: "00000000-0000-0000-0000-000000000404",
    body: {
      name: "Nubank",
      type: "CASH",
      initialBalanceCents: 0,
      active: true,
    },
  });

  assert.equal(response.status, 404);
  assert.equal(response.body.error, "Carteira nao encontrada");
});

test("controller alterna status de carteira com JSON booleano", async () => {
  const service = new FakeWalletService();
  const response = await setWalletActiveJson({
    context: makeContext(),
    service,
    id: "00000000-0000-0000-0000-000000000001",
    body: { active: false },
  });

  assert.equal(response.status, 200);
  assert.deepEqual(service.setActiveCommand, {
    id: "00000000-0000-0000-0000-000000000001",
  });
  assert.equal(response.body.status, "deactivated");
  assert.equal(response.body.wallet?.active, false);
});

test("controller preserva erros de negocio como 400", async () => {
  class InvalidService extends FakeWalletService {
    override async create(): Promise<Wallet> {
      throw new InvalidWalletError("Nome da carteira e obrigatorio");
    }
  }

  const response = await createWalletJson({
    context: makeContext(),
    service: new InvalidService(),
    body: { name: " ", type: "CASH" },
  });

  assert.equal(response.status, 400);
  assert.equal(response.body.error, "Nome da carteira e obrigatorio");
});
