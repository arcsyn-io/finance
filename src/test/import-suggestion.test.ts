import assert from "node:assert/strict";
import test from "node:test";

import type { ImportSuggestionHistoryEntry } from "../domain/import/import-suggestion";
import { suggestImportFields } from "../domain/import/import-suggestion";

test("sugere campos para descricao equivalente apos normalizacao", () => {
  const suggestion = suggestImportFields(
    "Compra no débito - SUPER ALIANÇA SCHROED",
    [historyEntry({ description: "Super Alianca Schroed" })],
  );

  assert.deepEqual(suggestion, {
    categoryId: "category-1",
    nature: "OPERATIONAL",
    economicEvent: "CONSUMPTION",
    confidence: 85,
  });
});

test("agrega scores pela tupla e pode superar um match exato isolado", () => {
  const suggestion = suggestImportFields("Mercado Central", [
    historyEntry({
      categoryId: "category-exact",
      description: "Mercado Central",
    }),
    historyEntry({
      categoryId: "category-frequent",
      description: "Mercado Central Loja 1",
    }),
    historyEntry({
      categoryId: "category-frequent",
      description: "Mercado Central Loja 2",
    }),
  ]);

  assert.equal(suggestion.categoryId, "category-frequent");
  assert.equal(suggestion.confidence, 100);
});

test("desempata pela ocorrencia historica mais recente", () => {
  const suggestion = suggestImportFields("Subzero", [
    historyEntry({ categoryId: "category-recent", description: "Subzero" }),
    historyEntry({ categoryId: "category-old", description: "Subzero" }),
  ]);

  assert.equal(suggestion.categoryId, "category-recent");
});

test("desempata pela maior quantidade quando a soma de scores e igual", () => {
  const suggestion = suggestImportFields("alpha beta gamma delta", [
    historyEntry({
      categoryId: "category-fewer",
      description: "alpha beta gamma delta",
    }),
    historyEntry({
      categoryId: "category-fewer",
      description: "alpha gamma beta delta",
    }),
    historyEntry({
      categoryId: "category-more",
      description: "alpha beta gamma epsilon",
    }),
    historyEntry({
      categoryId: "category-more",
      description: "alpha beta delta epsilon",
    }),
    historyEntry({
      categoryId: "category-more",
      description: "alpha gamma delta epsilon",
    }),
  ]);

  assert.equal(suggestion.categoryId, "category-more");
});

test("nao sugere sem tokens uteis ou score minimo", () => {
  assert.deepEqual(
    suggestImportFields("Compra no débito", [
      historyEntry({ description: "Compra no debito" }),
    ]),
    {
      categoryId: null,
      nature: null,
      economicEvent: null,
      confidence: 0,
    },
  );
  assert.equal(
    suggestImportFields("Padaria", [
      historyEntry({ description: "Posto de gasolina" }),
    ]).categoryId,
    null,
  );
});

function historyEntry(
  patch: Partial<ImportSuggestionHistoryEntry>,
): ImportSuggestionHistoryEntry {
  return {
    categoryId: "category-1",
    nature: "OPERATIONAL",
    economicEvent: "CONSUMPTION",
    description: "Descricao historica",
    ...patch,
  };
}
