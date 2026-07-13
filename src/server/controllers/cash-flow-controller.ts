import type { ApplicationContext } from "../context/application-context";
import { updateCashFlowConfigRequestToCommand } from "../mappers/cash-flow-mapper";
import type { HttpJsonResponse } from "../responses/http-json-response";
import { updateCashFlowConfigRequestSchema } from "../schemas/cash-flow-schema";
import type { CashFlowService } from "../services/cash-flow-service";

type CashFlowControllerDependencies = {
  readonly context: ApplicationContext;
  readonly service: Pick<CashFlowService, "updateConfig">;
};

type CashFlowConfigMutationResponse = HttpJsonResponse<{
  readonly status?: "updated";
  readonly error?: string;
}>;

export async function updateCashFlowConfigJson({
  context,
  service,
  body,
}: CashFlowControllerDependencies & {
  readonly body: unknown;
}): Promise<CashFlowConfigMutationResponse> {
  const result = updateCashFlowConfigRequestSchema.safeParse(body);

  if (!result.success) {
    return {
      status: 400,
      body: {
        error:
          result.error.issues[0]?.message ??
          "Dados da configuracao do fluxo de caixa invalidos",
      },
    };
  }

  try {
    await service.updateConfig(
      context,
      updateCashFlowConfigRequestToCommand(result.data),
    );
    return { status: 200, body: { status: "updated" } };
  } catch {
    return {
      status: 500,
      body: {
        error: "Nao foi possivel salvar a configuracao do fluxo de caixa",
      },
    };
  }
}
