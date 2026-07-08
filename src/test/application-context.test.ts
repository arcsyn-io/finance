import assert from "node:assert/strict";
import test from "node:test";

import {
  ApplicationContext,
  AuthenticationRequiredError,
  TransactionContext,
} from "../server/context/application-context";

test("cria contexto de usuario e exige principal autenticado", () => {
  const now = new Date("2026-07-08T12:00:00.000Z");
  const context = ApplicationContext.user({
    principalId: "user-1",
    correlationId: "corr-1",
    now,
  });

  assert.deepEqual(context.requireUserPrincipal(), {
    type: "user",
    id: "user-1",
  });
  assert.equal(context.correlationId, "corr-1");
  assert.equal(context.now, now);
});

test("falha ao exigir usuario em contexto de sistema", () => {
  const context = ApplicationContext.system({ principalId: "system-job" });

  assert.throws(
    () => context.requireUserPrincipal(),
    AuthenticationRequiredError,
  );
});

test("deriva contexto transacional preservando metadados", () => {
  const now = new Date("2026-07-08T12:00:00.000Z");
  const context = ApplicationContext.user({
    principalId: "user-1",
    correlationId: "corr-1",
    now,
  });
  const transaction = new TransactionContext({ tx: true });

  const transactionalContext = context.withTransaction(transaction);

  assert.notEqual(transactionalContext, context);
  assert.equal(transactionalContext.transaction, transaction);
  assert.equal(transactionalContext.principal, context.principal);
  assert.equal(transactionalContext.correlationId, "corr-1");
  assert.equal(transactionalContext.now, now);
  assert.equal(context.transaction, undefined);
});

test("deriva contexto sem transacao preservando identidade", () => {
  const transaction = new TransactionContext({ tx: true });
  const context = ApplicationContext.system({
    principalId: "system-job",
  }).withTransaction(transaction);

  const withoutTransaction = context.withoutTransaction();

  assert.equal(withoutTransaction.transaction, undefined);
  assert.deepEqual(withoutTransaction.principal, {
    type: "system",
    id: "system-job",
  });
});
