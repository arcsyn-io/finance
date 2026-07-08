import assert from "node:assert/strict";
import test from "node:test";

import {
  ApplicationContext,
  TransactionContext,
} from "../server/context/application-context";
import { resolveDatabaseClient } from "../server/repositories/database-client";
import { UnitOfWork } from "../server/unit-of-work/unit-of-work";

class FakeUnitOfWork implements UnitOfWork {
  async execute<T>(
    context: ApplicationContext,
    work: (context: ApplicationContext) => Promise<T>,
  ): Promise<T> {
    const transaction = new TransactionContext({ tx: true });

    return work(context.withTransaction(transaction));
  }
}

test("UnitOfWork executa callback com contexto transacional", async () => {
  const context = ApplicationContext.user({ principalId: "user-1" });
  const unitOfWork = new FakeUnitOfWork();

  const result = await unitOfWork.execute(context, async (txContext) => {
    assert.notEqual(txContext, context);
    assert.ok(txContext.transaction);
    assert.equal(context.transaction, undefined);

    return "done";
  });

  assert.equal(result, "done");
});

test("UnitOfWork propaga erro do callback", async () => {
  const context = ApplicationContext.user({ principalId: "user-1" });
  const unitOfWork = new FakeUnitOfWork();

  await assert.rejects(
    () =>
      unitOfWork.execute(context, async () => {
        throw new Error("falha esperada");
      }),
    /falha esperada/,
  );
});

test("resolveDatabaseClient usa client padrao sem transacao", () => {
  const defaultClient = { name: "default" };
  const context = ApplicationContext.user({ principalId: "user-1" });

  assert.equal(resolveDatabaseClient(context, defaultClient), defaultClient);
});

test("resolveDatabaseClient usa client transacional quando existir", () => {
  const defaultClient = { name: "default" };
  const transactionClient = { name: "transaction" };
  const context = ApplicationContext.user({
    principalId: "user-1",
  }).withTransaction(new TransactionContext(transactionClient));

  assert.equal(resolveDatabaseClient(context, defaultClient), transactionClient);
});
