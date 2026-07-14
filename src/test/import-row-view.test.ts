import assert from "node:assert/strict";
import test from "node:test";

import type { ImportRow } from "../domain/import/import";
import {
  getImportRowViewStatus,
  getVisibleImportRowStatus,
  groupImportRowsByStatus,
  orderImportRowsByDate,
} from "../modules/imports/view-models/import-row-view";

const baseRow: ImportRow = {
  id: "row-base",
  importRequestId: "import-1",
  userId: "user-1",
  rowNumber: 1,
  occurredOn: "2026-07-01",
  description: "Linha base",
  amountCents: 100,
  direction: "IN",
  nature: null,
  walletId: null,
  walletName: null,
  categoryId: null,
  categoryName: null,
  categoryColor: null,
  categoryIcon: null,
  externalId: null,
  valid: true,
  validationErrors: null,
  economicEvent: null,
  entryId: null,
  ignoredAt: null,
  attachmentCount: 0,
  createdAt: new Date("2026-07-01T00:00:00.000Z"),
  updatedAt: new Date("2026-07-01T00:00:00.000Z"),
};

function row(patch: Partial<ImportRow>): ImportRow {
  return { ...baseRow, ...patch };
}

test("deriva status visual da linha de importacao", () => {
  assert.equal(getImportRowViewStatus(row({ entryId: "entry-1" })), "ready");
  assert.equal(
    getImportRowViewStatus(row({ ignoredAt: new Date("2026-07-02T00:00:00.000Z") })),
    "ignored",
  );
  assert.equal(
    getImportRowViewStatus(
      row({ categoryId: "category-1", walletId: "wallet-1" }),
      { defaultCategoryId: null, defaultWalletId: null, nature: "OPERATIONAL" },
    ),
    "ready",
  );
  assert.equal(getImportRowViewStatus(row({})), "pending");
});

test("mantem o status anterior enquanto a linha esta em edicao", () => {
  const completeRow = row({
    categoryId: "category-1",
    walletId: "wallet-1",
    nature: "OPERATIONAL",
  });

  assert.equal(
    getVisibleImportRowStatus(completeRow, undefined, "pending"),
    "pending",
  );
  assert.equal(getVisibleImportRowStatus(completeRow), "ready");
});

test("ordena linhas por data e numero original da linha", () => {
  const rows = [
    row({ id: "late", occurredOn: "2026-07-03", rowNumber: 2 }),
    row({ id: "second", occurredOn: "2026-07-01", rowNumber: 4 }),
    row({ id: "first", occurredOn: "2026-07-01", rowNumber: 3 }),
  ];

  assert.deepEqual(
    orderImportRowsByDate(rows).map((item) => item.id),
    ["first", "second", "late"],
  );
});

test("agrupa linhas por status na ordem esperada", () => {
  const groups = groupImportRowsByStatus([
    row({ id: "ignored", ignoredAt: new Date("2026-07-05T00:00:00.000Z") }),
    row({ id: "ready", entryId: "entry-1" }),
    row({ id: "pending" }),
  ]);

  assert.deepEqual(
    groups.map((group) => [group.key, group.label, group.count]),
    [
      ["pending", "Pendente", 1],
      ["ready", "Concluido", 1],
      ["ignored", "Ignorada", 1],
    ],
  );
});
