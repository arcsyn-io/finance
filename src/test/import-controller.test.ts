import assert from "node:assert/strict";
import test from "node:test";

import type { DeleteImportRowCommand } from "../server/commands/import-commands";
import { ApplicationContext } from "../server/context/application-context";
import { deleteImportRowJson } from "../server/controllers/import-controller";

class FakeImportService {
  deleteCommand: DeleteImportRowCommand | null = null;

  async list() {
    return [];
  }

  async findById(): Promise<never> {
    throw new Error("Nao implementado no teste");
  }

  async create(): Promise<never> {
    throw new Error("Nao implementado no teste");
  }

  async updateRow(): Promise<never> {
    throw new Error("Nao implementado no teste");
  }

  async setRowIgnored(): Promise<never> {
    throw new Error("Nao implementado no teste");
  }

  async deleteRow(
    _context: ApplicationContext,
    command: DeleteImportRowCommand,
  ): Promise<void> {
    this.deleteCommand = command;
  }

  async confirm() {
    return { importedCount: 0, skippedCount: 0 };
  }

  async cancel() {
    return undefined;
  }
}

test("controller remove linha de importacao por ids validos", async () => {
  const service = new FakeImportService();
  const response = await deleteImportRowJson({
    context: makeContext(),
    service,
    importRequestId: "00000000-0000-0000-0000-000000000001",
    rowId: "00000000-0000-0000-0000-000000000002",
  });

  assert.equal(response.status, 200);
  assert.equal(response.body.status, "deleted");
  assert.equal(
    response.body.deletedRowId,
    "00000000-0000-0000-0000-000000000002",
  );
  assert.deepEqual(service.deleteCommand, {
    importRequestId: "00000000-0000-0000-0000-000000000001",
    rowId: "00000000-0000-0000-0000-000000000002",
  });
});

test("controller rejeita remocao de linha com id invalido", async () => {
  const response = await deleteImportRowJson({
    context: makeContext(),
    service: new FakeImportService(),
    importRequestId: "00000000-0000-0000-0000-000000000001",
    rowId: "linha-invalida",
  });

  assert.equal(response.status, 400);
});

function makeContext() {
  return ApplicationContext.user({
    principalId: "user-1",
    now: new Date("2026-07-09T12:00:00.000Z"),
  });
}
