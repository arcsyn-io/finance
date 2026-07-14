import assert from "node:assert/strict";
import test from "node:test";
import {
  economicEventHelp,
  financialHelpSections,
} from "../modules/help/view-models/financial-help-content";
import { economicEventFlowGuides } from "../modules/help/view-models/economic-event-flow-guides";

test("a ajuda cobre os conceitos e os eventos econômicos do sistema", () => {
  const sectionIds = financialHelpSections.map((section) => section.id);
  const eventIds = economicEventHelp.map((event) => event.id);

  assert.deepEqual(sectionIds, [
    "lancamentos",
    "carteiras",
    "categorias",
    "natureza",
    "eventos",
  ]);
  assert.deepEqual(eventIds, [
    "INCOME",
    "CAPITAL_INCOME",
    "CONSUMPTION",
    "INVESTMENT",
    "DIVESTMENT",
    "LIQUIDATION",
    "TRANSFER",
    "ADJUSTMENT",
    "LOSS",
    "INITIAL_BALANCE",
  ]);
  assert.match(financialHelpSections[2]!.description, /direção/i);
  assert.match(financialHelpSections[3]!.description, /fluxo de caixa/i);
  assert.ok(economicEventHelp.every((event) => event.example.length > 0));
  assert.deepEqual(
    economicEventFlowGuides.map((guide) => guide.id),
    ["classificacao", "cartao", "transferencia", "investimento"],
  );
});
