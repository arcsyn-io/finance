import { CategoryNotFoundError } from "../../domain/category/category-errors";
import type { Entry } from "../../domain/entry/entry";
import {
  EntryNotFoundError,
  InvalidEntryError,
} from "../../domain/entry/entry-errors";
import { WalletNotFoundError } from "../../domain/wallet/wallet-errors";
import type { ApplicationContext } from "../context/application-context";
import {
  createEntryRequestToCommand,
  deleteEntryRequestToCommand,
  listEntriesRequestToCommand,
  restoreEntryRequestToCommand,
  updateEntryRequestToCommand,
} from "../mappers/entry-mapper";
import type { HttpJsonResponse } from "../responses/http-json-response";
import {
  createEntryRequestSchema,
  entryIdRequestSchema,
  listEntriesRequestSchema,
  updateEntryRequestSchema,
} from "../schemas/entry-schema";
import type { EntryService } from "../services/entry-service";

type EntryControllerDependencies = {
  readonly context: ApplicationContext;
  readonly service: Pick<
    EntryService,
    "list" | "create" | "update" | "delete" | "restore"
  >;
};

type EntryMutationResponse = HttpJsonResponse<{
  readonly status?: "created" | "updated" | "deleted" | "restored";
  readonly entry?: Entry;
  readonly error?: string;
}>;

type EntryListResponse = HttpJsonResponse<{
  readonly entries?: Entry[];
  readonly totals?: {
    readonly count: number;
    readonly incomeCents: number;
    readonly expenseCents: number;
    readonly netCents: number;
  };
  readonly error?: string;
}>;

export async function listEntriesJson({
  context,
  service,
  query,
}: EntryControllerDependencies & {
  readonly query: unknown;
}): Promise<EntryListResponse> {
  const result = listEntriesRequestSchema.safeParse(query);

  if (!result.success) {
    return validationError(result.error.issues[0]?.message);
  }

  try {
    const entries = await service.list(
      context,
      listEntriesRequestToCommand(result.data),
    );

    return {
      status: 200,
      body: {
        entries,
        totals: calculateTotals(entries),
      },
    };
  } catch {
    return {
      status: 500,
      body: { error: "Nao foi possivel listar os lancamentos" },
    };
  }
}

export async function createEntryJson({
  context,
  service,
  body,
}: EntryControllerDependencies & {
  readonly body: unknown;
}): Promise<EntryMutationResponse> {
  const result = createEntryRequestSchema.safeParse(body);

  if (!result.success) {
    return validationError(result.error.issues[0]?.message);
  }

  try {
    const entry = await service.create(
      context,
      createEntryRequestToCommand(result.data),
    );
    return { status: 201, body: { status: "created", entry } };
  } catch (error) {
    return entryError(error);
  }
}

export async function updateEntryJson({
  context,
  service,
  id,
  body,
}: EntryControllerDependencies & {
  readonly id: string;
  readonly body: unknown;
}): Promise<EntryMutationResponse> {
  const request =
    typeof body === "object" && body !== null ? { ...body, id } : { id };
  const result = updateEntryRequestSchema.safeParse(request);

  if (!result.success) {
    return validationError(result.error.issues[0]?.message);
  }

  try {
    const entry = await service.update(
      context,
      updateEntryRequestToCommand(result.data),
    );
    return { status: 200, body: { status: "updated", entry } };
  } catch (error) {
    return entryError(error);
  }
}

export async function deleteEntryJson({
  context,
  service,
  id,
}: EntryControllerDependencies & {
  readonly id: string;
}): Promise<EntryMutationResponse> {
  const result = entryIdRequestSchema.safeParse({ id });

  if (!result.success) {
    return validationError(result.error.issues[0]?.message);
  }

  try {
    const entry = await service.delete(
      context,
      deleteEntryRequestToCommand(result.data),
    );
    return { status: 200, body: { status: "deleted", entry } };
  } catch (error) {
    return entryError(error);
  }
}

export async function restoreEntryJson({
  context,
  service,
  id,
}: EntryControllerDependencies & {
  readonly id: string;
}): Promise<EntryMutationResponse> {
  const result = entryIdRequestSchema.safeParse({ id });

  if (!result.success) {
    return validationError(result.error.issues[0]?.message);
  }

  try {
    const entry = await service.restore(
      context,
      restoreEntryRequestToCommand(result.data),
    );
    return { status: 200, body: { status: "restored", entry } };
  } catch (error) {
    return entryError(error);
  }
}

function calculateTotals(entries: readonly Entry[]) {
  return entries
    .filter((entry) => !entry.deletedAt)
    .reduce(
      (totals, entry) => {
        if (entry.direction === "IN") {
          totals.incomeCents += entry.amountCents;
        } else {
          totals.expenseCents += entry.amountCents;
        }

        totals.count += 1;
        totals.netCents = totals.incomeCents - totals.expenseCents;

        return totals;
      },
      { count: 0, incomeCents: 0, expenseCents: 0, netCents: 0 },
    );
}

function validationError(message = "Dados do lancamento invalidos") {
  return {
    status: 400,
    body: { error: message },
  } as const;
}

function entryError(error: unknown): EntryMutationResponse {
  if (
    error instanceof EntryNotFoundError ||
    error instanceof WalletNotFoundError ||
    error instanceof CategoryNotFoundError
  ) {
    return {
      status: 404,
      body: { error: error.message },
    };
  }

  if (error instanceof InvalidEntryError) {
    return {
      status: 400,
      body: { error: error.message },
    };
  }

  return {
    status: 500,
    body: { error: "Nao foi possivel salvar o lancamento" },
  };
}
