import type {
  EntryAttachment,
  EntryAttachmentWithPreview,
} from "../../domain/entry/entry-attachment";
import { EntryNotFoundError } from "../../domain/entry/entry-errors";
import type { ApplicationContext } from "../context/application-context";
import type { HttpJsonResponse } from "../responses/http-json-response";
import {
  entryAttachmentEntryIdSchema,
  validateEntryAttachmentFile,
} from "../schemas/entry-attachment-schema";
import type { EntryAttachmentService } from "../services/entry-attachment-service";

type EntryAttachmentControllerDependencies = {
  readonly context: ApplicationContext;
  readonly service: Pick<EntryAttachmentService, "upload" | "list">;
};

type EntryAttachmentResponse = HttpJsonResponse<{
  readonly attachment?: EntryAttachment;
  readonly attachments?: readonly EntryAttachmentWithPreview[];
  readonly error?: string;
}>;

export async function uploadEntryAttachmentJson({
  context,
  entryId,
  formData,
  service,
}: EntryAttachmentControllerDependencies & {
  readonly entryId: string;
  readonly formData: FormData;
}): Promise<EntryAttachmentResponse> {
  const idResult = entryAttachmentEntryIdSchema.safeParse({ entryId });

  if (!idResult.success) {
    return validationError(idResult.error.issues[0]?.message);
  }

  let file: File;
  try {
    file = validateEntryAttachmentFile(formData.get("file"));
  } catch (error) {
    return validationError(error instanceof Error ? error.message : undefined);
  }

  try {
    const attachment = await service.upload(context, {
      entryId: idResult.data.entryId,
      file,
    });

    return { status: 201, body: { attachment } };
  } catch (error) {
    return attachmentError(error);
  }
}

export async function listEntryAttachmentsJson({
  context,
  entryId,
  service,
}: EntryAttachmentControllerDependencies & {
  readonly entryId: string;
}): Promise<EntryAttachmentResponse> {
  const idResult = entryAttachmentEntryIdSchema.safeParse({ entryId });

  if (!idResult.success) {
    return validationError(idResult.error.issues[0]?.message);
  }

  try {
    const attachments = await service.list(context, {
      entryId: idResult.data.entryId,
    });

    return { status: 200, body: { attachments } };
  } catch (error) {
    return attachmentError(error);
  }
}

function validationError(message = "Dados do anexo invalidos") {
  return {
    status: 400,
    body: { error: message },
  } as const;
}

function attachmentError(error: unknown): EntryAttachmentResponse {
  if (error instanceof EntryNotFoundError) {
    return { status: 404, body: { error: error.message } };
  }

  return {
    status: 500,
    body: { error: "Nao foi possivel processar o anexo" },
  };
}
