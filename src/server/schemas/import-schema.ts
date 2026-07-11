import { z } from "zod";
import { economicEvents, entryNatures } from "@/domain/entry/entry";
import { importSources } from "@/domain/import/import";

export const listImportsRequestSchema = z.object({
  includeConfirmed: z.boolean().default(false),
});

export const createImportRequestSchema = z.object({
  source: z.enum(importSources),
  defaultWalletId: z.string().uuid().nullable(),
  defaultCategoryId: z.string().uuid().nullable(),
  nature: z.enum(entryNatures).nullable(),
  economicEvent: z.enum(economicEvents).nullable(),
  fileName: z.string().min(1, "Arquivo e obrigatorio"),
  fileContent: z.string().min(1, "Arquivo e obrigatorio"),
  fileSizeBytes: z.number().int().nonnegative(),
});

export const updateImportRowRequestSchema = z.object({
  importRequestId: z.string().uuid(),
  rowId: z.string().uuid(),
  description: z.string().min(1, "Descricao e obrigatoria"),
  occurredOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data invalida"),
  amountCents: z.number().int().positive("Valor deve ser maior que zero"),
  walletId: z.string().uuid().nullable(),
  categoryId: z.string().uuid().nullable(),
  nature: z.enum(entryNatures).nullable(),
  economicEvent: z.enum(economicEvents).nullable(),
});

export const setImportRowIgnoredRequestSchema = z.object({
  importRequestId: z.string().uuid(),
  rowId: z.string().uuid(),
  ignored: z.boolean(),
});

export const importIdRequestSchema = z.object({
  id: z.string().uuid(),
});
