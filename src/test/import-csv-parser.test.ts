import assert from "node:assert/strict";
import test from "node:test";
import { parseImportCsv } from "../domain/import/import-csv-parser";
import { InvalidImportError } from "../domain/import/import-errors";

test("parseia CSV Nubank cartao e converte valor positivo para saida", () => {
  const rows = parseImportCsv({
    fileName: "fatura.csv",
    source: "NUBANK_CSV",
    sizeBytes: 88,
    content:
      'date,title,amount\n2026-07-01,"IOF de ""Openai *Chatgpt""",4.05\n2026-07-02,Estorno,-2.5',
  });

  assert.equal(rows.length, 2);
  assert.deepEqual(rows[0], {
    rowNumber: 2,
    occurredOn: "2026-07-01",
    description: 'IOF de "Openai *Chatgpt"',
    amountCents: 405,
    direction: "OUT",
    externalId: null,
  });
  assert.equal(rows[1]?.amountCents, 250);
  assert.equal(rows[1]?.direction, "IN");
});

test("parseia CSV NuConta e preserva identificador externo", () => {
  const rows = parseImportCsv({
    fileName: "conta.csv",
    source: "NU_CONTA_CSV",
    sizeBytes: 96,
    content:
      "Data,Valor,Identificador,Descricao\n03/01/2026,-1512.50,abc-123,Transferencia enviada pelo Pix",
  });

  assert.deepEqual(rows[0], {
    rowNumber: 2,
    occurredOn: "2026-01-03",
    description: "Transferencia enviada pelo Pix",
    amountCents: 151250,
    direction: "OUT",
    externalId: "abc-123",
  });
});

test("rejeita arquivo nao CSV", () => {
  assert.throws(
    () =>
      parseImportCsv({
        fileName: "extrato.txt",
        source: "NUBANK_CSV",
        sizeBytes: 1,
        content: "date,title,amount\n",
      }),
    InvalidImportError,
  );
});
