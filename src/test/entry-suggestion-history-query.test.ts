import assert from "node:assert/strict";
import test from "node:test";

import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "../db/schema";
import { buildImportSuggestionHistoryQuery } from "../server/repositories/entry-suggestion-history-query";

test("query de sugestao isola usuario e filtra o historico elegivel", () => {
  const compiled = buildImportSuggestionHistoryQuery(
    createQueryDatabase(),
    "user-1",
    { direction: "OUT", walletId: "wallet-1", limit: 1000 },
  ).toSQL();

  assert.match(compiled.sql, /inner join "categories"/);
  assert.match(compiled.sql, /"entries"\."user_id" =/);
  assert.match(compiled.sql, /"categories"\."user_id" =/);
  assert.match(compiled.sql, /"entries"\."direction" =/);
  assert.match(compiled.sql, /"entries"\."wallet_id" =/);
  assert.match(compiled.sql, /"entries"\."deleted_at" is null/);
  assert.match(compiled.sql, /"entries"\."transfer_id" is null/);
  assert.match(compiled.sql, /"entries"\."category_id" is not null/);
  assert.match(
    compiled.sql,
    /order by "entries"\."occurred_on" desc, "entries"\."created_at" desc, "entries"\."id" desc/,
  );
  assert.match(compiled.sql, /limit/);
  assert.ok(compiled.params.includes("user-1"));
  assert.ok(compiled.params.includes("OUT"));
  assert.ok(compiled.params.includes("wallet-1"));
  assert.ok(compiled.params.includes(1000));
});

test("query de sugestao considera todas as carteiras sem default", () => {
  const compiled = buildImportSuggestionHistoryQuery(
    createQueryDatabase(),
    "user-1",
    { direction: "IN", walletId: null, limit: 1000 },
  ).toSQL();

  assert.doesNotMatch(compiled.sql, /"entries"\."wallet_id" =/);
});

function createQueryDatabase() {
  const client = Object.assign(
    async () => [],
    { options: { parsers: {}, serializers: {} } },
  );

  return drizzle(client as never, { schema }) as unknown as Parameters<
    typeof buildImportSuggestionHistoryQuery
  >[0];
}
