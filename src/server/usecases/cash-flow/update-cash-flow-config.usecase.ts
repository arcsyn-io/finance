import type { UpdateCashFlowConfigCommand } from "../../commands/cash-flow-commands";
import type { ApplicationContext } from "../../context/application-context";
import type {
  CashFlowRepository,
  UpsertCashFlowConfigData,
} from "../../repositories/cash-flow-repository";

const REFERENCE_MONTH_PATTERN = /^(\d{4})-(0[1-9]|1[0-2])$/;

export class UpdateCashFlowConfigUseCase {
  constructor(private readonly repository: CashFlowRepository) {}

  async execute(
    context: ApplicationContext,
    input: UpdateCashFlowConfigCommand,
  ): Promise<void> {
    const { year, month } = parseReferenceMonth(input.referenceMonth);
    validateMoneyInCents(input.openingBalanceCents, "Saldo inicial");
    validateMoneyInCents(input.minimumCashCents, "Caixa minimo");

    const finalMonth = input.applyToFollowingMonths ? 12 : month;
    const configs: UpsertCashFlowConfigData[] = [];

    for (let currentMonth = month; currentMonth <= finalMonth; currentMonth += 1) {
      configs.push({
        referenceMonth: formatReferenceMonth(year, currentMonth),
        openingBalanceCents: input.openingBalanceCents,
        minimumCashCents: input.minimumCashCents,
      });
    }

    await this.repository.upsertMany(context, configs);
  }
}

function parseReferenceMonth(referenceMonth: string): {
  readonly year: number;
  readonly month: number;
} {
  const match = REFERENCE_MONTH_PATTERN.exec(referenceMonth);

  if (!match) {
    throw new Error("Mes de referencia invalido.");
  }

  return {
    year: Number(match[1]),
    month: Number(match[2]),
  };
}

function validateMoneyInCents(value: number, fieldName: string): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${fieldName} deve ser informado em centavos inteiros nao negativos.`);
  }
}

function formatReferenceMonth(year: number, month: number): string {
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}`;
}
