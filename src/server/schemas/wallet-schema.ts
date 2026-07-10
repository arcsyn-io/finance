import { z } from "zod";
import { walletTypes } from "../../domain/wallet/wallet";

export const walletTypeSchema = z.enum(walletTypes, {
  errorMap: () => ({ message: "Tipo da carteira e obrigatorio" }),
});

export const walletMoneyCentsSchema = z
  .number({
    invalid_type_error: "Saldo inicial deve ser informado em centavos",
  })
  .int("Saldo inicial deve ser informado em centavos");

export const createWalletRequestSchema = z.object({
  name: z.string(),
  type: walletTypeSchema.optional(),
  initialBalanceCents: walletMoneyCentsSchema.optional(),
  active: z.boolean().optional(),
});

export const updateWalletRequestSchema = z.object({
  id: z.string().uuid("Carteira nao encontrada"),
  name: z.string(),
  type: walletTypeSchema.optional(),
  initialBalanceCents: walletMoneyCentsSchema,
  active: z.boolean(),
});

export const setWalletActiveRequestSchema = z.object({
  id: z.string().uuid("Carteira nao encontrada"),
});

export type CreateWalletRequest = z.infer<typeof createWalletRequestSchema>;
export type UpdateWalletRequest = z.infer<typeof updateWalletRequestSchema>;
export type SetWalletActiveRequest = z.infer<
  typeof setWalletActiveRequestSchema
>;
