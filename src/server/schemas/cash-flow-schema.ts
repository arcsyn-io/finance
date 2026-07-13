import { z } from "zod";

const nonNegativeCentsSchema = (fieldName: string) =>
  z
    .number({
      required_error: `${fieldName} deve ser informado em centavos`,
      invalid_type_error: `${fieldName} deve ser um inteiro nao negativo em centavos`,
    })
    .int(`${fieldName} deve ser um inteiro nao negativo em centavos`)
    .nonnegative(`${fieldName} deve ser um inteiro nao negativo em centavos`);

export const cashFlowReferenceMonthSchema = z
  .string({
    required_error: "Mes de referencia e obrigatorio",
    invalid_type_error: "Mes de referencia deve estar no formato YYYY-MM",
  })
  .regex(
    /^\d{4}-(?:0[1-9]|1[0-2])$/,
    "Mes de referencia deve estar no formato YYYY-MM",
  );

export const updateCashFlowConfigRequestSchema = z.object({
  referenceMonth: cashFlowReferenceMonthSchema,
  openingBalanceCents: nonNegativeCentsSchema("Saldo inicial"),
  minimumCashCents: nonNegativeCentsSchema("Caixa minimo"),
  applyToFollowingMonths: z.boolean({
    required_error: "Aplicar aos meses seguintes deve ser verdadeiro ou falso",
    invalid_type_error:
      "Aplicar aos meses seguintes deve ser verdadeiro ou falso",
  }),
});

export type UpdateCashFlowConfigRequest = z.infer<
  typeof updateCashFlowConfigRequestSchema
>;
