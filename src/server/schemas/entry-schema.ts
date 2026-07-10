import { z } from "zod";
import { economicEvents, entryNatures } from "../../domain/entry/entry";

export const entryNatureSchema = z.enum(entryNatures, {
  errorMap: () => ({ message: "Natureza do lancamento e obrigatoria" }),
});

export const economicEventSchema = z.enum(economicEvents, {
  errorMap: () => ({ message: "Evento economico invalido" }),
});

export const entryAmountCentsSchema = z
  .number({ invalid_type_error: "Valor deve ser informado em centavos" })
  .int("Valor deve ser informado em centavos")
  .nonnegative("Valor nao pode ser negativo");

export const entryDateSchema = z
  .string({ required_error: "Data do lancamento e obrigatoria" })
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Data do lancamento e obrigatoria");

export const createEntryRequestSchema = z.object({
  walletId: z.string().uuid("Carteira nao encontrada"),
  categoryId: z.string().uuid("Categoria nao encontrada"),
  nature: entryNatureSchema,
  economicEvent: economicEventSchema.optional(),
  amountCents: entryAmountCentsSchema,
  occurredOn: entryDateSchema,
  description: z.string().optional(),
});

export const updateEntryRequestSchema = createEntryRequestSchema.extend({
  id: z.string().uuid("Lancamento nao encontrado"),
});

export const entryIdRequestSchema = z.object({
  id: z.string().uuid("Lancamento nao encontrado"),
});

export const listEntriesRequestSchema = z.object({
  startDate: entryDateSchema.optional(),
  endDate: entryDateSchema.optional(),
  walletIds: z.array(z.string().uuid()).optional(),
  categoryIds: z.array(z.string().uuid()).optional(),
  natures: z.array(entryNatureSchema).optional(),
  economicEvents: z.array(economicEventSchema).optional(),
  includeDeleted: z.boolean().default(false),
});

export type CreateEntryRequest = z.infer<typeof createEntryRequestSchema>;
export type UpdateEntryRequest = z.infer<typeof updateEntryRequestSchema>;
export type EntryIdRequest = z.infer<typeof entryIdRequestSchema>;
export type ListEntriesRequest = z.infer<typeof listEntriesRequestSchema>;
