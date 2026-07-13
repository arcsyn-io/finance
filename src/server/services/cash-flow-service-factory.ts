import { cashFlowRepository } from "@/server/repositories/cash-flow-repository";
import { CashFlowService } from "@/server/services/cash-flow-service";
import { unitOfWork } from "@/server/unit-of-work/drizzle-unit-of-work";

export function createCashFlowService(): CashFlowService {
  return new CashFlowService({
    repository: cashFlowRepository,
    unitOfWork,
  });
}
