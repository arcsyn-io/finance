import assert from "node:assert/strict";
import test from "node:test";

import {
  importReviewTableHeadings,
  importRowNavigationFields,
} from "../modules/imports/view-models/import-review-table";

test("inclui natureza como campo editavel entre carteira e evento", () => {
  assert.deepEqual(importReviewTableHeadings, [
    "",
    "Data",
    "Categoria",
    "Descricao",
    "Carteira",
    "Natureza",
    "Evento",
    "Valor",
    "Status",
    "",
  ]);
  assert.deepEqual(importRowNavigationFields, [
    "occurredOn",
    "categoryId",
    "description",
    "walletId",
    "nature",
    "economicEvent",
    "amountCents",
  ]);
});
