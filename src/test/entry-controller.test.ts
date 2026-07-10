import assert from "node:assert/strict";
import test from "node:test";

import type { Entry } from "../domain/entry/entry";
import {
  EntryNotFoundError,
  InvalidEntryError,
} from "../domain/entry/entry-errors";
import type {
  CreateEntryCommand,
  DeleteEntryCommand,
  RestoreEntryCommand,
  UpdateEntryCommand,
} from "../server/commands/entry-commands";
import { ApplicationContext } from "../server/context/application-context";
import {
  createEntryJson,
  deleteEntryJson,
  restoreEntryJson,
  updateEntryJson,
} from "../server/controllers/entry-controller";

class FakeEntryService {
  createCommand: CreateEntryCommand | null = null;
  updateCommand: UpdateEntryCommand | null = null;
  deleteCommand: DeleteEntryCommand | null = null;
  restoreCommand: RestoreEntryCommand | null = null;

  async list(): Promise<Entry[]> {
    return [];
  }

  async create(
    context: ApplicationContext,
    command: CreateEntryCommand,
  ): Promise<Entry> {
    this.createCommand = command;
    return makeEntry(context, "entry-1", command);
  }

  async update(
    context: ApplicationContext,
    command: UpdateEntryCommand,
  ): Promise<Entry> {
    this.updateCommand = command;

    if (command.id === "00000000-0000-0000-0000-000000000404") {
      throw new EntryNotFoundError();
    }

    return makeEntry(context, command.id, command);
  }

  async delete(
    context: ApplicationContext,
    command: DeleteEntryCommand,
  ): Promise<Entry> {
    this.deleteCommand = command;
    return {
      ...makeEntry(context, command.id, {
        walletId: "wallet-1",
        categoryId: "category-1",
        nature: "OPERATIONAL",
        amountCents: 100,
        occurredOn: "2026-07-10",
      }),
      deletedAt: context.now,
    };
  }

  async restore(
    context: ApplicationContext,
    command: RestoreEntryCommand,
  ): Promise<Entry> {
    this.restoreCommand = command;
    return makeEntry(context, command.id, {
      walletId: "wallet-1",
      categoryId: "category-1",
      nature: "OPERATIONAL",
      amountCents: 100,
      occurredOn: "2026-07-10",
    });
  }
}

function makeContext() {
  return ApplicationContext.user({
    principalId: "user-1",
    now: new Date("2026-07-10T12:00:00.000Z"),
  });
}

function makeEntry(
  context: ApplicationContext,
  id: string,
  command: Omit<CreateEntryCommand, "economicEvent"> & {
    readonly economicEvent?: CreateEntryCommand["economicEvent"];
  },
): Entry {
  return {
    id,
    userId: context.requireUserPrincipal().id,
    legacyId: null,
    walletId: command.walletId,
    categoryId: command.categoryId,
    transferId: null,
    economicEventId: null,
    nature: command.nature,
    direction: "OUT",
    amountCents: command.amountCents,
    occurredOn: command.occurredOn,
    description: command.description ?? null,
    externalId: null,
    economicEvent: command.economicEvent ?? "CONSUMPTION",
    receiptPath: null,
    deletedAt: null,
    createdAt: context.now,
    updatedAt: context.now,
    walletName: null,
    categoryName: null,
    categoryColor: null,
    categoryIcon: null,
  };
}

test("controller cria lancamento a partir de JSON valido", async () => {
  const service = new FakeEntryService();
  const response = await createEntryJson({
    context: makeContext(),
    service,
    body: {
      walletId: "00000000-0000-0000-0000-000000000001",
      categoryId: "00000000-0000-0000-0000-000000000002",
      nature: "OPERATIONAL",
      economicEvent: "INCOME",
      amountCents: 12500,
      occurredOn: "2026-07-10",
      description: "Venda",
    },
  });

  assert.equal(response.status, 201);
  assert.deepEqual(service.createCommand, {
    walletId: "00000000-0000-0000-0000-000000000001",
    categoryId: "00000000-0000-0000-0000-000000000002",
    nature: "OPERATIONAL",
    economicEvent: "INCOME",
    amountCents: 12500,
    occurredOn: "2026-07-10",
    description: "Venda",
  });
  assert.equal(response.body.status, "created");
});

test("controller retorna 400 para valor invalido", async () => {
  const response = await createEntryJson({
    context: makeContext(),
    service: new FakeEntryService(),
    body: {
      walletId: "00000000-0000-0000-0000-000000000001",
      categoryId: "00000000-0000-0000-0000-000000000002",
      nature: "OPERATIONAL",
      amountCents: 0,
      occurredOn: "2026-07-10",
    },
  });

  assert.equal(response.status, 400);
  assert.equal(response.body.error, "Valor deve ser maior que zero");
});

test("controller retorna 404 para lancamento inexistente", async () => {
  const response = await updateEntryJson({
    context: makeContext(),
    service: new FakeEntryService(),
    id: "00000000-0000-0000-0000-000000000404",
    body: {
      walletId: "00000000-0000-0000-0000-000000000001",
      categoryId: "00000000-0000-0000-0000-000000000002",
      nature: "OPERATIONAL",
      amountCents: 100,
      occurredOn: "2026-07-10",
    },
  });

  assert.equal(response.status, 404);
  assert.equal(response.body.error, "Lancamento nao encontrado");
});

test("controller exclui e restaura com JSON", async () => {
  const service = new FakeEntryService();
  const context = makeContext();

  const deleted = await deleteEntryJson({
    context,
    service,
    id: "00000000-0000-0000-0000-000000000001",
  });
  const restored = await restoreEntryJson({
    context,
    service,
    id: "00000000-0000-0000-0000-000000000001",
  });

  assert.equal(deleted.status, 200);
  assert.equal(deleted.body.status, "deleted");
  assert.equal(deleted.body.entry?.deletedAt?.toISOString(), context.now.toISOString());
  assert.equal(restored.status, 200);
  assert.equal(restored.body.status, "restored");
});

test("controller preserva erro de negocio como 400", async () => {
  class InvalidService extends FakeEntryService {
    override async create(): Promise<Entry> {
      throw new InvalidEntryError("Carteira inativa nao pode receber lancamentos");
    }
  }

  const response = await createEntryJson({
    context: makeContext(),
    service: new InvalidService(),
    body: {
      walletId: "00000000-0000-0000-0000-000000000001",
      categoryId: "00000000-0000-0000-0000-000000000002",
      nature: "OPERATIONAL",
      amountCents: 100,
      occurredOn: "2026-07-10",
    },
  });

  assert.equal(response.status, 400);
  assert.equal(response.body.error, "Carteira inativa nao pode receber lancamentos");
});
