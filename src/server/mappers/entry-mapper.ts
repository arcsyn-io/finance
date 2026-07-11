import type {
  CreateEntryCommand,
  DeleteEntryCommand,
  LinkEntryTransferCommand,
  ListEntriesCommand,
  RestoreEntryCommand,
  UpdateEntryCommand,
} from "../commands/entry-commands";
import type {
  CreateEntryRequest,
  EntryIdRequest,
  LinkEntryTransferRequest,
  ListEntriesRequest,
  UpdateEntryRequest,
} from "../schemas/entry-schema";

export function listEntriesRequestToCommand(
  request: ListEntriesRequest,
): ListEntriesCommand {
  return {
    startDate: request.startDate,
    endDate: request.endDate,
    walletIds: request.walletIds,
    categoryIds: request.categoryIds,
    natures: request.natures,
    economicEvents: request.economicEvents,
    includeDeleted: request.includeDeleted,
  };
}

export function createEntryRequestToCommand(
  request: CreateEntryRequest,
): CreateEntryCommand {
  return {
    walletId: request.walletId,
    categoryId: request.categoryId,
    nature: request.nature,
    economicEvent: request.economicEvent,
    amountCents: request.amountCents,
    occurredOn: request.occurredOn,
    description: request.description,
  };
}

export function updateEntryRequestToCommand(
  request: UpdateEntryRequest,
): UpdateEntryCommand {
  return {
    id: request.id,
    walletId: request.walletId,
    categoryId: request.categoryId,
    nature: request.nature,
    economicEvent: request.economicEvent,
    amountCents: request.amountCents,
    occurredOn: request.occurredOn,
    description: request.description,
  };
}

export function deleteEntryRequestToCommand(
  request: EntryIdRequest,
): DeleteEntryCommand {
  return { id: request.id };
}

export function restoreEntryRequestToCommand(
  request: EntryIdRequest,
): RestoreEntryCommand {
  return { id: request.id };
}

export function linkEntryTransferRequestToCommand(
  request: LinkEntryTransferRequest,
): LinkEntryTransferCommand {
  if (request.mode === "existing") {
    return {
      mode: "existing",
      sourceEntryId: request.sourceEntryId,
      targetEntryId: request.targetEntryId,
    };
  }

  return {
    mode: "create",
    sourceEntryId: request.sourceEntryId,
    walletId: request.walletId,
    categoryId: request.categoryId,
    nature: request.nature,
    description: request.description,
  };
}
