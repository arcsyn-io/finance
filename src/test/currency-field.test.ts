import assert from "node:assert/strict";
import test from "node:test";

import {
  currencyInputToCents,
  formatCurrencyInput,
} from "../components/ui/CurrencyField";

test("CurrencyField formata digitos como valor monetario em centavos", () => {
  const valueInCents = currencyInputToCents("110230");

  assert.equal(valueInCents, 110230);
  assert.equal(formatCurrencyInput(valueInCents), "1.102,30");
});
