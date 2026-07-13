import type { UpdateCashFlowConfigCommand } from "../commands/cash-flow-commands";
import type { UpdateCashFlowConfigRequest } from "../schemas/cash-flow-schema";

export function updateCashFlowConfigRequestToCommand(
  request: UpdateCashFlowConfigRequest,
): UpdateCashFlowConfigCommand {
  return {
    referenceMonth: request.referenceMonth,
    openingBalanceCents: request.openingBalanceCents,
    minimumCashCents: request.minimumCashCents,
    applyToFollowingMonths: request.applyToFollowingMonths,
  };
}
