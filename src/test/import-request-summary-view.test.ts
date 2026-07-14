import assert from "node:assert/strict";
import test from "node:test";

import type { ImportRequest } from "../domain/import/import";
import { toImportRequestSummaryView } from "../modules/imports/view-models/import-request-summary-view";

const now = new Date("2026-07-13T12:00:00.000Z");

test("resume linhas de importacao para a listagem sem transportar as linhas", () => {
  const summary = toImportRequestSummaryView({
    id: "import-1",
    userId: "user-1",
    source: "NUBANK_CSV",
    status: "PENDING_REVIEW",
    fileName: "fatura.csv",
    nature: null,
    economicEvent: null,
    confirmedAt: null,
    defaultWalletId: null,
    defaultWalletName: null,
    defaultCategoryId: null,
    defaultCategoryName: null,
    attachmentCount: 0,
    createdAt: now,
    updatedAt: now,
    rows: [
      makeRow({ id: "ready" }),
      makeRow({ id: "ignored", ignoredAt: now }),
      makeRow({ id: "confirmed", entryId: "entry-1" }),
    ],
  });

  assert.deepEqual(summary, {
    id: "import-1",
    source: "NUBANK_CSV",
    status: "PENDING_REVIEW",
    fileName: "fatura.csv",
    createdAt: now,
    totalRows: 3,
    pendingRows: 1,
    ignoredRows: 1,
  });
  assert.equal("rows" in summary, false);
});

function makeRow(patch: Partial<ImportRequest["rows"][number]>) {
  return {
    id: "row-1",
    importRequestId: "import-1",
    userId: "user-1",
    rowNumber: 1,
    occurredOn: "2026-07-12",
    description: "Linha",
    amountCents: 100,
    direction: "OUT" as const,
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
    createdAt: now,
    updatedAt: now,
    ...patch,
  };
}
