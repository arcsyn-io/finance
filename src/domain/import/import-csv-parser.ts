import type { ImportSource, ParsedImportRow } from "./import";
import { InvalidImportError } from "./import-errors";

const maxCsvSizeBytes = 5 * 1024 * 1024;

export function parseImportCsv(input: {
  readonly fileName: string;
  readonly content: string;
  readonly source: ImportSource;
  readonly sizeBytes: number;
}): ParsedImportRow[] {
  if (!input.fileName.toLowerCase().endsWith(".csv")) {
    throw new InvalidImportError("Apenas arquivos CSV sao aceitos");
  }

  if (input.sizeBytes > maxCsvSizeBytes) {
    throw new InvalidImportError("Arquivo CSV excede o limite de 5 MB");
  }

  const lines = input.content
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0);

  if (lines.length < 2) {
    throw new InvalidImportError("Arquivo CSV nao contem lancamentos validos");
  }

  const rows = lines.slice(1).flatMap((line, index) => {
    const rowNumber = index + 2;
    return input.source === "NUBANK_CSV"
      ? parseNubankRow(line, rowNumber)
      : parseNuContaRow(line, rowNumber);
  });

  if (rows.length === 0) {
    throw new InvalidImportError("Arquivo CSV nao contem lancamentos validos");
  }

  return rows;
}

function parseNubankRow(line: string, rowNumber: number): ParsedImportRow[] {
  const parts = parseCsvFields(line);

  if (parts.length >= 4 && looksLikeNuContaRow(parts)) {
    return parseNuContaParts(parts, rowNumber);
  }

  if (parts.length < 3) {
    return [];
  }

  const occurredOn = parseIsoDate(parts[0]);
  const amount = parseMoney(parts[2]);

  if (!occurredOn || amount === null) {
    return [];
  }

  const amountCents = toCents(amount);

  if (amountCents <= 0) {
    return [];
  }

  return [
    {
      rowNumber,
      occurredOn,
      description: parts[1].trim(),
      amountCents,
      direction: amount >= 0 ? "OUT" : "IN",
      externalId: null,
    },
  ];
}

function parseNuContaRow(line: string, rowNumber: number): ParsedImportRow[] {
  return parseNuContaParts(parseCsvFields(line), rowNumber);
}

function parseNuContaParts(
  parts: readonly string[],
  rowNumber: number,
): ParsedImportRow[] {
  if (parts.length < 4) {
    return [];
  }

  const occurredOn = parseBrazilianDate(parts[0]);
  const amount = parseMoney(parts[1]);

  if (!occurredOn || amount === null) {
    return [];
  }

  const amountCents = toCents(amount);

  if (amountCents <= 0) {
    return [];
  }

  return [
    {
      rowNumber,
      occurredOn,
      description: parts[3].trim(),
      amountCents,
      direction: amount >= 0 ? "IN" : "OUT",
      externalId: parts[2].trim() || null,
    },
  ];
}

function parseCsvFields(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];

    if (inQuotes) {
      if (char === '"') {
        if (line[index + 1] === '"') {
          current += '"';
          index += 1;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      fields.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  fields.push(current);
  return fields;
}

function parseIsoDate(value: string): string | null {
  const normalized = value.trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(normalized) ? normalized : null;
}

function parseBrazilianDate(value: string): string | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim());

  if (!match) {
    return null;
  }

  return `${match[3]}-${match[2]}-${match[1]}`;
}

function parseMoney(value: string): number | null {
  const parsed = Number(value.trim().replace(",", ".").replace(/\s+/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function toCents(value: number): number {
  return Math.round(Math.abs(value) * 100);
}

function looksLikeNuContaRow(parts: readonly string[]): boolean {
  return parseBrazilianDate(parts[0]) !== null && parseMoney(parts[1]) !== null;
}
