import assert from "node:assert/strict";
import test from "node:test";

import type { UpdateCashFlowConfigCommand } from "../server/commands/cash-flow-commands";
import { ApplicationContext } from "../server/context/application-context";
import { updateCashFlowConfigJson } from "../server/controllers/cash-flow-controller";

class FakeCashFlowService {
  updateCommand: UpdateCashFlowConfigCommand | null = null;
  shouldFail = false;

  async updateConfig(
    _context: ApplicationContext,
    command: UpdateCashFlowConfigCommand,
  ): Promise<void> {
    if (this.shouldFail) {
      throw new Error("falha inesperada");
    }

    this.updateCommand = command;
  }
}

function makeContext() {
  return ApplicationContext.user({
    principalId: "00000000-0000-0000-0000-000000000001",
    now: new Date("2026-07-12T12:00:00.000Z"),
  });
}

test("controller atualiza configuracao mensal a partir de JSON valido", async () => {
  const service = new FakeCashFlowService();
  const response = await updateCashFlowConfigJson({
    context: makeContext(),
    service,
    body: {
      referenceMonth: "2026-07",
      openingBalanceCents: 125_00,
      minimumCashCents: 80_00,
      applyToFollowingMonths: true,
    },
  });

  assert.equal(response.status, 200);
  assert.deepEqual(service.updateCommand, {
    referenceMonth: "2026-07",
    openingBalanceCents: 125_00,
    minimumCashCents: 80_00,
    applyToFollowingMonths: true,
  });
  assert.equal(response.body.status, "updated");
});

test("controller rejeita mes fora do formato YYYY-MM", async () => {
  for (const referenceMonth of ["2026-7", "2026-00", "2026-13", "07-2026"]) {
    const service = new FakeCashFlowService();
    const response = await updateCashFlowConfigJson({
      context: makeContext(),
      service,
      body: validBody({ referenceMonth }),
    });

    assert.equal(response.status, 400);
    assert.equal(
      response.body.error,
      "Mes de referencia deve estar no formato YYYY-MM",
    );
    assert.equal(service.updateCommand, null);
  }
});

test("controller rejeita valores monetarios negativos ou fracionarios", async () => {
  const invalidBodies = [
    validBody({ openingBalanceCents: -1 }),
    validBody({ openingBalanceCents: 10.5 }),
    validBody({ minimumCashCents: -1 }),
    validBody({ minimumCashCents: 10.5 }),
  ];

  for (const body of invalidBodies) {
    const service = new FakeCashFlowService();
    const response = await updateCashFlowConfigJson({
      context: makeContext(),
      service,
      body,
    });

    assert.equal(response.status, 400);
    assert.equal(service.updateCommand, null);
  }
});

test("controller exige applyToFollowingMonths booleano", async () => {
  const service = new FakeCashFlowService();
  const response = await updateCashFlowConfigJson({
    context: makeContext(),
    service,
    body: validBody({ applyToFollowingMonths: "true" }),
  });

  assert.equal(response.status, 400);
  assert.equal(
    response.body.error,
    "Aplicar aos meses seguintes deve ser verdadeiro ou falso",
  );
  assert.equal(service.updateCommand, null);
});

test("controller traduz falha inesperada do service para erro interno", async () => {
  const service = new FakeCashFlowService();
  service.shouldFail = true;

  const response = await updateCashFlowConfigJson({
    context: makeContext(),
    service,
    body: validBody(),
  });

  assert.equal(response.status, 500);
  assert.equal(
    response.body.error,
    "Nao foi possivel salvar a configuracao do fluxo de caixa",
  );
});

function validBody(overrides: Record<string, unknown> = {}) {
  return {
    referenceMonth: "2026-07",
    openingBalanceCents: 125_00,
    minimumCashCents: 80_00,
    applyToFollowingMonths: false,
    ...overrides,
  };
}
