import { CategoryNotFoundError } from "@/domain/category/category-errors";
import { InvalidImportError, ImportNotFoundError } from "@/domain/import/import-errors";
import { WalletNotFoundError } from "@/domain/wallet/wallet-errors";
import type { ApplicationContext } from "@/server/context/application-context";
import type { HttpJsonResponse } from "@/server/responses/http-json-response";
import {
  createImportRequestSchema,
  importIdRequestSchema,
  listImportsRequestSchema,
  setImportRowIgnoredRequestSchema,
  updateImportRowRequestSchema,
} from "@/server/schemas/import-schema";
import type { ImportService } from "@/server/services/import-service";

type ImportControllerDependencies = {
  readonly context: ApplicationContext;
  readonly service: Pick<
    ImportService,
    "list" | "findById" | "create" | "updateRow" | "setRowIgnored" | "confirm" | "cancel"
  >;
};

type ImportResponse = HttpJsonResponse<{
  readonly imports?: Awaited<ReturnType<ImportService["list"]>>;
  readonly importRequest?: Awaited<ReturnType<ImportService["findById"]>>;
  readonly row?: Awaited<ReturnType<ImportService["setRowIgnored"]>>;
  readonly result?: Awaited<ReturnType<ImportService["confirm"]>>;
  readonly status?: string;
  readonly error?: string;
}>;

export async function listImportsJson({
  context,
  query,
  service,
}: ImportControllerDependencies & { readonly query: unknown }): Promise<ImportResponse> {
  const result = listImportsRequestSchema.safeParse(query);
  if (!result.success) return validationError(result.error.issues[0]?.message);

  try {
    return {
      status: 200,
      body: { imports: await service.list(context, result.data) },
    };
  } catch {
    return { status: 500, body: { error: "Nao foi possivel listar importacoes" } };
  }
}

export async function getImportJson({
  context,
  id,
  service,
}: ImportControllerDependencies & { readonly id: string }): Promise<ImportResponse> {
  const result = importIdRequestSchema.safeParse({ id });
  if (!result.success) return validationError(result.error.issues[0]?.message);

  try {
    return {
      status: 200,
      body: { importRequest: await service.findById(context, result.data.id) },
    };
  } catch (error) {
    return importError(error);
  }
}

export async function createImportJson({
  body,
  context,
  service,
}: ImportControllerDependencies & { readonly body: unknown }): Promise<ImportResponse> {
  const result = createImportRequestSchema.safeParse(body);
  if (!result.success) return validationError(result.error.issues[0]?.message);

  try {
    return {
      status: 201,
      body: {
        status: "created",
        importRequest: await service.create(context, result.data),
      },
    };
  } catch (error) {
    return importError(error);
  }
}

export async function updateImportRowJson({
  body,
  context,
  importRequestId,
  rowId,
  service,
}: ImportControllerDependencies & {
  readonly body: unknown;
  readonly importRequestId: string;
  readonly rowId: string;
}): Promise<ImportResponse> {
  const request =
    typeof body === "object" && body !== null
      ? { ...body, importRequestId, rowId }
      : { importRequestId, rowId };
  const result = updateImportRowRequestSchema.safeParse(request);
  if (!result.success) return validationError(result.error.issues[0]?.message);

  try {
    return {
      status: 200,
      body: {
        status: "updated",
        row: await service.updateRow(context, result.data),
      },
    };
  } catch (error) {
    return importError(error);
  }
}

export async function setImportRowIgnoredJson({
  body,
  context,
  importRequestId,
  rowId,
  service,
}: ImportControllerDependencies & {
  readonly body: unknown;
  readonly importRequestId: string;
  readonly rowId: string;
}): Promise<ImportResponse> {
  const request =
    typeof body === "object" && body !== null
      ? { ...body, importRequestId, rowId }
      : { importRequestId, rowId };
  const result = setImportRowIgnoredRequestSchema.safeParse(request);
  if (!result.success) return validationError(result.error.issues[0]?.message);

  try {
    return {
      status: 200,
      body: {
        status: result.data.ignored ? "ignored" : "restored",
        row: await service.setRowIgnored(context, result.data),
      },
    };
  } catch (error) {
    return importError(error);
  }
}

export async function confirmImportJson({
  context,
  id,
  service,
}: ImportControllerDependencies & { readonly id: string }): Promise<ImportResponse> {
  const result = importIdRequestSchema.safeParse({ id });
  if (!result.success) return validationError(result.error.issues[0]?.message);

  try {
    return {
      status: 200,
      body: {
        status: "confirmed",
        result: await service.confirm(context, result.data),
      },
    };
  } catch (error) {
    return importError(error);
  }
}

export async function cancelImportJson({
  context,
  id,
  service,
}: ImportControllerDependencies & { readonly id: string }): Promise<ImportResponse> {
  const result = importIdRequestSchema.safeParse({ id });
  if (!result.success) return validationError(result.error.issues[0]?.message);

  try {
    await service.cancel(context, result.data);
    return { status: 200, body: { status: "cancelled" } };
  } catch (error) {
    return importError(error);
  }
}

function validationError(message = "Dados da importacao invalidos"): ImportResponse {
  return { status: 400, body: { error: message } };
}

function importError(error: unknown): ImportResponse {
  if (
    error instanceof ImportNotFoundError ||
    error instanceof WalletNotFoundError ||
    error instanceof CategoryNotFoundError
  ) {
    return { status: 404, body: { error: error.message } };
  }

  if (error instanceof InvalidImportError) {
    return { status: 400, body: { error: error.message } };
  }

  return { status: 500, body: { error: "Nao foi possivel salvar a importacao" } };
}
