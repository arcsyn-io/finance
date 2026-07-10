import type { Wallet } from "../../domain/wallet/wallet";
import {
  DuplicateWalletNameError,
  InvalidWalletError,
  WalletNotFoundError,
} from "../../domain/wallet/wallet-errors";
import type { ApplicationContext } from "../context/application-context";
import {
  createWalletRequestToCommand,
  setWalletActiveRequestToCommand,
  updateWalletRequestToCommand,
} from "../mappers/wallet-mapper";
import type { HttpJsonResponse } from "../responses/http-json-response";
import {
  createWalletRequestSchema,
  setWalletActiveRequestSchema,
  updateWalletRequestSchema,
} from "../schemas/wallet-schema";
import type { WalletService } from "../services/wallet-service";

type WalletControllerDependencies = {
  readonly context: ApplicationContext;
  readonly service: Pick<
    WalletService,
    "create" | "update" | "activate" | "deactivate"
  >;
};

type WalletMutationResponse = HttpJsonResponse<{
  readonly status?: "created" | "updated" | "activated" | "deactivated";
  readonly wallet?: Wallet;
  readonly error?: string;
}>;

export async function createWalletJson({
  context,
  service,
  body,
}: WalletControllerDependencies & {
  readonly body: unknown;
}): Promise<WalletMutationResponse> {
  const result = createWalletRequestSchema.safeParse(body);

  if (!result.success) {
    return validationError(result.error.issues[0]?.message);
  }

  try {
    const wallet = await service.create(
      context,
      createWalletRequestToCommand(result.data),
    );
    return { status: 201, body: { status: "created", wallet } };
  } catch (error) {
    return walletError(error);
  }
}

export async function updateWalletJson({
  context,
  service,
  id,
  body,
}: WalletControllerDependencies & {
  readonly id: string;
  readonly body: unknown;
}): Promise<WalletMutationResponse> {
  const request =
    typeof body === "object" && body !== null ? { ...body, id } : { id };
  const result = updateWalletRequestSchema.safeParse(request);

  if (!result.success) {
    return validationError(result.error.issues[0]?.message);
  }

  try {
    const wallet = await service.update(
      context,
      updateWalletRequestToCommand(result.data),
    );
    return { status: 200, body: { status: "updated", wallet } };
  } catch (error) {
    return walletError(error);
  }
}

export async function setWalletActiveJson({
  context,
  service,
  id,
  body,
}: WalletControllerDependencies & {
  readonly id: string;
  readonly body: unknown;
}): Promise<WalletMutationResponse> {
  const active = parseActive(body);

  if (typeof active !== "boolean") {
    return validationError("Status da carteira e obrigatorio");
  }

  const result = setWalletActiveRequestSchema.safeParse({ id });

  if (!result.success) {
    return validationError(result.error.issues[0]?.message);
  }

  try {
    const command = setWalletActiveRequestToCommand(result.data);

    if (active) {
      const wallet = await service.activate(context, command);
      return { status: 200, body: { status: "activated", wallet } };
    }

    const wallet = await service.deactivate(context, command);
    return { status: 200, body: { status: "deactivated", wallet } };
  } catch (error) {
    return walletError(error);
  }
}

function parseActive(body: unknown): boolean | undefined {
  if (typeof body !== "object" || body === null || !("active" in body)) {
    return undefined;
  }

  const active = body.active;

  return typeof active === "boolean" ? active : undefined;
}

function validationError(message = "Dados da carteira invalidos") {
  return {
    status: 400,
    body: { error: message },
  } as const;
}

function walletError(error: unknown): WalletMutationResponse {
  if (error instanceof WalletNotFoundError) {
    return {
      status: 404,
      body: { error: error.message },
    };
  }

  if (
    error instanceof InvalidWalletError ||
    error instanceof DuplicateWalletNameError
  ) {
    return {
      status: 400,
      body: { error: error.message },
    };
  }

  return {
    status: 500,
    body: { error: "Nao foi possivel salvar a carteira" },
  };
}
