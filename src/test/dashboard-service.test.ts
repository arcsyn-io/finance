import assert from "node:assert/strict";
import test from "node:test";
import { ApplicationContext } from "../server/context/application-context";
import type {
  DashboardRecentEntryRow,
  DashboardRepository,
  DashboardWalletBalanceRow,
} from "../server/repositories/dashboard-repository";
import { DashboardService } from "../server/services/dashboard-service";

const context = ApplicationContext.user({
  principalId: "00000000-0000-0000-0000-000000000001",
});

test("consolida liquidez, patrimônio, investimento e dívida sem misturar fluxo operacional", async () => {
  const repository = createRepository({
    wallets: [
      wallet({ id: "cash-main", name: "Conta principal", type: "CASH", balanceCents: 120_000 }),
      wallet({ id: "cash-negative", name: "Dinheiro", type: "CASH", balanceCents: -2_000 }),
      wallet({ id: "card", name: "Cartão", type: "CREDIT_CARD", balanceCents: -25_000 }),
      wallet({ id: "broker", name: "Corretora", type: "NEGOTIABLE_SECURITY", balanceCents: 300_000 }),
      wallet({ id: "reserve", name: "Reserva", type: "LONG_TERM", balanceCents: 90_000 }),
      wallet({ id: "home", name: "Apartamento", type: "ASSET", balanceCents: 500_000 }),
    ],
    recentEntries: [
      recentEntry({
        id: "entry-1",
        description: "Mercado",
        direction: "OUT",
        amountCents: 18_500,
        categoryName: "Alimentação",
      }),
    ],
  });
  const service = new DashboardService(repository);

  const result = await service.get(context, { recentEntriesLimit: 5 });

  assert.equal(result.realLiquidityCents, 118_000);
  assert.equal(result.netWorthCents, 983_000);
  assert.equal(result.financialInvestmentsCents, 390_000);
  assert.equal(result.creditCardDebtCents, 25_000);
  assert.deepEqual(result.negativeWallets, [
    {
      id: "cash-negative",
      name: "Dinheiro",
      type: "CASH",
      balanceCents: -2_000,
    },
  ]);
  assert.deepEqual(result.recentEntries, [
    {
      id: "entry-1",
      description: "Mercado",
      direction: "OUT",
      amountCents: 18_500,
      occurredOn: "2026-07-14",
      walletName: "Conta principal",
      categoryName: "Alimentação",
    },
  ]);
});

test("retorna uma posição vazia quando não há carteiras nem lançamentos", async () => {
  const service = new DashboardService(createRepository({}));

  const result = await service.get(context, { recentEntriesLimit: 5 });

  assert.equal(result.realLiquidityCents, 0);
  assert.equal(result.netWorthCents, 0);
  assert.equal(result.financialInvestmentsCents, 0);
  assert.equal(result.creditCardDebtCents, 0);
  assert.deepEqual(result.wallets, []);
  assert.deepEqual(result.negativeWallets, []);
  assert.deepEqual(result.recentEntries, []);
});

function createRepository({
  wallets = [],
  recentEntries = [],
}: {
  readonly wallets?: readonly DashboardWalletBalanceRow[];
  readonly recentEntries?: readonly DashboardRecentEntryRow[];
}): DashboardRepository {
  return {
    listActiveWalletBalances: async () => wallets,
    listRecentEntries: async () => recentEntries,
  };
}

function wallet(
  overrides: Partial<DashboardWalletBalanceRow> = {},
): DashboardWalletBalanceRow {
  return {
    id: "wallet-1",
    name: "Carteira",
    type: "CASH",
    balanceCents: 0,
    ...overrides,
  };
}

function recentEntry(
  overrides: Partial<DashboardRecentEntryRow> = {},
): DashboardRecentEntryRow {
  return {
    id: "entry-1",
    description: null,
    direction: "IN",
    amountCents: 0,
    occurredOn: "2026-07-14",
    walletName: "Conta principal",
    categoryName: null,
    ...overrides,
  };
}
