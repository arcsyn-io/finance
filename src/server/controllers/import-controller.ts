import { CategoryNotFoundError } from "../../domain/category/category-errors";
import { InvalidImportError, ImportNotFoundError } from "../../domain/import/import-errors";
import { WalletNotFoundError } from "../../domain/wallet/wallet-errors";
import type { ApplicationContext } from "../context/application-context";
import type { HttpJsonResponse } from "../responses/http-json-response";
import {
  bulkUpdateImportRowsRequestSchema,
  createImportRequestSchema,
  importIdRequestSchema,
  deleteImportsRequestSchema,
  listImportsRequestSchema,
  setImportRowIgnoredRequestSchema,
  updateImportRowRequestSchema,
} from "../schemas/import-schema";
import type { ImportService } from "../services/import-service";

type ImportControllerDependencies = {
  readonly context: ApplicationContext;
  readonly service: Pick<
    ImportService,
    "list" | "findById" | "create" | "updateRow" | "bulkUpdateRows" | "setRowIgnored" | "deleteRow" | "confirm" | "cancel" | "deleteMany"
  >;
};

type ImportResponse = HttpJsonResponse<{
  readonly imports?: Awaited<ReturnType<ImportService["list"]>>;
  readonly importRequest?: Awaited<ReturnType<ImportService["findById"]>>;
  readonly row?: Awaited<ReturnType<ImportService["setRowIgnored"]>>;
  readonly rows?: Awaited<ReturnType<ImportService["bulkUpdateRows"]>>;
  readonly deletedRowId?: string;
  readonly deletedImportIds?: readonly string[];
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

export async function bulkUpdateImportRowsJson({
  body,
  context,
  importRequestId,
  service,
}: ImportControllerDependencies & {
  readonly body: unknown;
  readonly importRequestId: string;
}): Promise<ImportResponse> {
  const request =
    typeof body === "object" && body !== null
      ? { ...body, importRequestId }
      : { importRequestId };
  const result = bulkUpdateImportRowsRequestSchema.safeParse(request);
  if (!result.success) return validationError(result.error.issues[0]?.message);

  try {
    return {
      status: 200,
      body: {
        status: "updated",
        rows: await service.bulkUpdateRows(context, result.data),
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

export async function deleteImportRowJson({
  context,
  importRequestId,
  rowId,
  service,
}: ImportControllerDependencies & {
  readonly importRequestId: string;
  readonly rowId: string;
}): Promise<ImportResponse> {
  const result = importIdRequestSchema.safeParse({ id: importRequestId });
  const rowResult = importIdRequestSchema.safeParse({ id: rowId });
  if (!result.success) return validationError(result.error.issues[0]?.message);
  if (!rowResult.success) return validationError(rowResult.error.issues[0]?.message);

  try {
    await service.deleteRow(context, {
      importRequestId: result.data.id,
      rowId: rowResult.data.id,
    });
    return { status: 200, body: { status: "deleted", deletedRowId: rowId } };
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

export async function deleteImportsJson({
  body,
  context,
  service,
}: ImportControllerDependencies & { readonly body: unknown }): Promise<ImportResponse> {
  const result = deleteImportsRequestSchema.safeParse(body);
  if (!result.success) return validationError(result.error.issues[0]?.message);

  try {
    await service.deleteMany(context, result.data);
    return {
      status: 200,
      body: { status: "deleted", deletedImportIds: result.data.ids },
    };
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
