import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import {
  ApplicationContext,
  TransactionContext,
} from "../server/context/application-context";
import type {
  CashFlowAggregateRow,
  CashFlowConfigRecord,
  CashFlowRepository,
  UpsertCashFlowConfigData,
} from "../server/repositories/cash-flow-repository";
import { CashFlowService } from "../server/services/cash-flow-service";

test("modal permite editar natureza e evento economico", () => {
  const source = readFileSync(
    join(
      process.cwd(),
      "src",
      "modules",
      "cash-flow",
      "components",
      "CashFlowEntriesDialog.tsx",
    ),
    "utf8",
  );

  assert.match(source, /aria-label="Natureza"/);
  assert.match(source, /aria-label="Evento econômico"/);
  assert.match(source, /nature: form\.nature/);
  assert.match(source, /economicEvent: form\.economicEvent \|\| undefined/);
});
import type { UnitOfWork } from "../server/unit-of-work/unit-of-work";

const context = ApplicationContext.user({
  principalId: "00000000-0000-0000-0000-000000000001",
  now: new Date("2026-07-12T12:00:00.000Z"),
});

test("consolida os doze meses sem misturar fluxo operacional e movimentacoes auxiliares", async () => {
  const rows: CashFlowAggregateRow[] = [
    aggregate({ month: "2026-01", direction: "IN", amountCents: 500_00 }),
    aggregate({ month: "2026-01", direction: "OUT", amountCents: 320_00 }),
    aggregate({
      month: "2026-03",
      direction: "OUT",
      categoryId: "home",
      categoryName: "Moradia",
      amountCents: 120_00,
    }),
    aggregate({
      month: "2026-01",
      direction: "IN",
      scope: "NON_OPERATIONAL",
      categoryId: "investment",
      categoryName: "Investimentos",
      amountCents: 900_00,
    }),
    aggregate({
      month: "2026-01",
      direction: "OUT",
      scope: "NON_OPERATIONAL",
      categoryId: "investment",
      categoryName: "Investimentos",
      amountCents: 250_00,
    }),
  ];
  const configs: CashFlowConfigRecord[] = [
    {
      referenceMonth: "2026-01",
      openingBalanceCents: 100_00,
      minimumCashCents: 80_00,
    },
  ];
  const service = new CashFlowService({
    repository: fakeRepository({ rows, configs }),
    unitOfWork: passthroughUnitOfWork,
  });

  const result = await service.getAnnual(context, { year: 2026 });

  assert.equal(result.months.length, 12);
  assert.deepEqual(
    result.months.slice(0, 3).map((month) => ({
      referenceMonth: month.referenceMonth,
      receiptsCents: month.receiptsCents,
      expensesCents: month.expensesCents,
      netCashFlowCents: month.netCashFlowCents,
      openingBalanceCents: month.openingBalanceCents,
      closingBalanceCents: month.closingBalanceCents,
      minimumCashCents: month.minimumCashCents,
      surplusOrDeficitCents: month.surplusOrDeficitCents,
      nonOperationalCashInCents: month.nonOperationalCashInCents,
      nonOperationalCashOutCents: month.nonOperationalCashOutCents,
    })),
    [
      {
        referenceMonth: "2026-01",
        receiptsCents: 500_00,
        expensesCents: 320_00,
        netCashFlowCents: 180_00,
        openingBalanceCents: 100_00,
        closingBalanceCents: 280_00,
        minimumCashCents: 80_00,
        surplusOrDeficitCents: 200_00,
        nonOperationalCashInCents: 900_00,
        nonOperationalCashOutCents: 250_00,
      },
      {
        referenceMonth: "2026-02",
        receiptsCents: 0,
        expensesCents: 0,
        netCashFlowCents: 0,
        openingBalanceCents: 0,
        closingBalanceCents: 0,
        minimumCashCents: 0,
        surplusOrDeficitCents: 0,
        nonOperationalCashInCents: 0,
        nonOperationalCashOutCents: 0,
      },
      {
        referenceMonth: "2026-03",
        receiptsCents: 0,
        expensesCents: 120_00,
        netCashFlowCents: -120_00,
        openingBalanceCents: 0,
        closingBalanceCents: -120_00,
        minimumCashCents: 0,
        surplusOrDeficitCents: -120_00,
        nonOperationalCashInCents: 0,
        nonOperationalCashOutCents: 0,
      },
    ],
  );
  assert.equal(result.operationalIncomeCategories[0]?.categoryName, "Sem categoria");
  assert.deepEqual(
    result.operationalIncomeCategories[0]?.monthlyAmountsCents.slice(0, 3),
    [500_00, 0, 0],
  );
  assert.equal(result.operationalExpenseCategories[0]?.categoryName, "Sem categoria");
  assert.equal(result.operationalExpenseCategories[1]?.categoryName, "Moradia");
  assert.equal(result.nonOperationalIncomeCategories[0]?.totalCents, 900_00);
  assert.equal(result.nonOperationalExpenseCategories[0]?.totalCents, 250_00);
});

test("ordena categorias pelo total anual decrescente", async () => {
  const rows: CashFlowAggregateRow[] = [
    aggregate({ categoryId: "small", categoryName: "Menor", amountCents: 100_00 }),
    aggregate({ categoryId: "large", categoryName: "Maior", amountCents: 350_00 }),
    aggregate({
      month: "2026-02",
      categoryId: "small",
      categoryName: "Menor",
      amountCents: 50_00,
    }),
  ];
  const service = new CashFlowService({
    repository: fakeRepository({ rows }),
    unitOfWork: passthroughUnitOfWork,
  });

  const result = await service.getAnnual(context, { year: 2026 });

  assert.deepEqual(
    result.operationalIncomeCategories.map((category) => category.categoryName),
    ["Maior", "Menor"],
  );
});

test("replica configuracao do mes selecionado ate dezembro dentro da transacao", async () => {
  let saved: readonly UpsertCashFlowConfigData[] = [];
  let usedTransaction = false;
  let transactionCount = 0;
  const repository = fakeRepository({
    onUpsertMany: (transactionContext, configs) => {
      usedTransaction = transactionContext.transaction !== undefined;
      saved = configs;
    },
  });
  const unitOfWork: UnitOfWork = {
    execute: async (applicationContext, work) => {
      transactionCount += 1;
      return work(
        applicationContext.withTransaction(
          new TransactionContext({ kind: "test-transaction" }),
        ),
      );
    },
  };
  const service = new CashFlowService({ repository, unitOfWork });

  await service.updateConfig(context, {
    referenceMonth: "2026-10",
    openingBalanceCents: 45_000,
    minimumCashCents: 12_000,
    applyToFollowingMonths: true,
  });

  assert.equal(transactionCount, 1);
  assert.equal(usedTransaction, true);
  assert.deepEqual(saved, [
    {
      referenceMonth: "2026-10",
      openingBalanceCents: 45_000,
      minimumCashCents: 12_000,
    },
    {
      referenceMonth: "2026-11",
      openingBalanceCents: 45_000,
      minimumCashCents: 12_000,
    },
    {
      referenceMonth: "2026-12",
      openingBalanceCents: 45_000,
      minimumCashCents: 12_000,
    },
  ]);
});

function aggregate(
  overrides: Partial<CashFlowAggregateRow> = {},
): CashFlowAggregateRow {
  return {
    month: "2026-01",
    scope: "OPERATIONAL",
    direction: "IN",
    categoryId: null,
    categoryName: null,
    categoryColor: null,
    amountCents: 0,
    ...overrides,
  };
}

function fakeRepository({
  rows = [],
  configs = [],
  onUpsertMany,
}: {
  readonly rows?: readonly CashFlowAggregateRow[];
  readonly configs?: readonly CashFlowConfigRecord[];
  readonly onUpsertMany?: (
    context: ApplicationContext,
    configs: readonly UpsertCashFlowConfigData[],
  ) => void;
} = {}): CashFlowRepository {
  return {
    listAnnualAggregates: async () => rows,
    listConfigsByYear: async () => configs,
    upsertMany: async (applicationContext, values) => {
      onUpsertMany?.(applicationContext, values);
    },
  };
}

const passthroughUnitOfWork: UnitOfWork = {
  execute: async (applicationContext, work) => work(applicationContext),
};
