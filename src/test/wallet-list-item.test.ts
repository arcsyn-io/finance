import assert from "node:assert/strict";
import test from "node:test";

import type { Entry } from "../domain/entry/entry";
import type { Wallet } from "../domain/wallet/wallet";
import { createWalletListItems } from "../modules/wallets/view-models/wallet-list-item";

test("calcula o saldo da carteira com saldo inicial e lançamentos ativos", () => {
  const [item] = createWalletListItems(
    [wallet({ initialBalanceCents: 1_000 })],
    [
      entry({ direction: "IN", amountCents: 500 }),
      entry({ direction: "OUT", amountCents: 200 }),
      entry({ direction: "IN", amountCents: 700, deletedAt: new Date() }),
    ],
  );

  assert.equal(item.entryBalanceCents, 300);
  assert.equal(item.balanceCents, 1_300);
});

test("mantém carteiras sem lançamentos com o respectivo saldo inicial", () => {
  const [item] = createWalletListItems([wallet({ initialBalanceCents: -500 })], []);

  assert.equal(item.entryBalanceCents, 0);
  assert.equal(item.balanceCents, -500);
});

function wallet(overrides: Partial<Wallet> = {}): Wallet {
  const now = new Date("2026-07-14T12:00:00.000Z");

  return {
    id: "wallet-1",
    userId: "user-1",
    legacyId: null,
    name: "Conta principal",
    type: "CASH",
    initialBalanceCents: 0,
    active: true,
    archivedAt: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function entry(overrides: Partial<Entry> = {}): Entry {
  const now = new Date("2026-07-14T12:00:00.000Z");

  return {
    id: "entry-1",
    userId: "user-1",
    legacyId: null,
    walletId: "wallet-1",
    categoryId: "category-1",
    transferId: null,
    economicEventId: null,
    nature: "OPERATIONAL",
    direction: "IN",
    amountCents: 0,
    occurredOn: "2026-07-14",
    description: null,
    externalId: null,
    economicEvent: null,
    receiptPath: null,
    deletedAt: null,
    createdAt: now,
    updatedAt: now,
    walletName: "Conta principal",
    categoryName: null,
    categoryColor: null,
    categoryIcon: null,
    ...overrides,
  };
}
