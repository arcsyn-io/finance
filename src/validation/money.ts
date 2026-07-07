import { z } from "zod";

export const centsSchema = z
  .number()
  .int("O valor deve ser inteiro em centavos.")
  .safe("O valor informado é muito alto.");

export function parseCurrencyToCents(value: string) {
  const normalized = value
    .replace(/\s/g, "")
    .replace(/\./g, "")
    .replace(",", ".");

  const parsed = Number.parseFloat(normalized);

  if (!Number.isFinite(parsed)) {
    return null;
  }

  return Math.round(parsed * 100);
}
