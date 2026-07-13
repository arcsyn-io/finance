import assert from "node:assert/strict";
import test from "node:test";
import type { Entry } from "../domain/entry/entry";
import { createMobileEntryViewModel } from "../modules/entries/view-models/entry-mobile-view-model";

test("view model móvel prioriza data, categoria e valor assinado", () => {
  const viewModel = createMobileEntryViewModel(entry({
    direction: "OUT",
    amountCents: 12_345,
    categoryName: "Alimentação",
    description: "Almoço",
  }));

  assert.deepEqual(viewModel, {
    occurredOn: "2026-07-13",
    categoryName: "Alimentação",
    description: "Almoço",
    signedAmountCents: -12_345,
    actionLabels: [
      "Editar lançamento",
      "Excluir lançamento",
      "Vincular transferência",
      "Abrir anexos",
    ],
  });
});

test("view model móvel disponibiliza restauração para lançamento excluído", () => {
  const viewModel = createMobileEntryViewModel(entry({
    deletedAt: new Date("2026-07-13T12:00:00.000Z"),
    transferId: "transfer-1",
  }));

  assert.deepEqual(viewModel.actionLabels, ["Restaurar lançamento", "Abrir anexos"]);
});

function entry(overrides: Partial<Entry> = {}): Entry {
  return {
    id: "entry-1",
    userId: "user-1",
    walletId: "wallet-1",
    categoryId: "category-1",
    transferId: null,
    economicEventId: null,
    nature: "OPERATIONAL",
    direction: "IN",
    amountCents: 1_000,
    occurredOn: "2026-07-13",
    description: null,
    externalId: null,
    economicEvent: null,
    receiptPath: null,
    deletedAt: null,
    createdAt: new Date("2026-07-13T12:00:00.000Z"),
    updatedAt: new Date("2026-07-13T12:00:00.000Z"),
    walletName: "Carteira principal",
    categoryName: null,
    categoryColor: null,
    categoryIcon: null,
    ...overrides,
  };
}
