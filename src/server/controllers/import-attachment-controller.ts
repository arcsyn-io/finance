import type {
  ImportAttachment,
  ImportAttachmentWithPreview,
} from "@/domain/import/import-attachment";
import { InvalidImportError, ImportNotFoundError } from "@/domain/import/import-errors";
import type { ApplicationContext } from "@/server/context/application-context";
import type { HttpJsonResponse } from "@/server/responses/http-json-response";
import {
  importAttachmentTargetSchema,
  validateImportAttachmentFile,
} from "@/server/schemas/import-attachment-schema";
import type { ImportAttachmentService } from "@/server/services/import-attachment-service";

type ImportAttachmentControllerDependencies = {
  readonly context: ApplicationContext;
  readonly service: Pick<ImportAttachmentService, "upload" | "list">;
};

type ImportAttachmentResponse = HttpJsonResponse<{
  readonly attachment?: ImportAttachment;
  readonly attachments?: readonly ImportAttachmentWithPreview[];
  readonly error?: string;
}>;

export async function uploadImportAttachmentJson({
  context,
  formData,
  importRequestId,
  importRowId,
  service,
}: ImportAttachmentControllerDependencies & {
  readonly formData: FormData;
  readonly importRequestId: string;
  readonly importRowId: string | null;
}): Promise<ImportAttachmentResponse> {
  const targetResult = importAttachmentTargetSchema.safeParse({
    importRequestId,
    importRowId,
  });

  if (!targetResult.success) {
    return validationError(targetResult.error.issues[0]?.message);
  }

  let file: File;
  try {
    file = validateImportAttachmentFile(formData.get("file"));
  } catch (error) {
    return validationError(error instanceof Error ? error.message : undefined);
  }

  try {
    const attachment = await service.upload(context, {
      importRequestId: targetResult.data.importRequestId,
      importRowId: targetResult.data.importRowId,
      file,
    });

    return { status: 201, body: { attachment } };
  } catch (error) {
    return attachmentError(error);
  }
}

export async function listImportAttachmentsJson({
  context,
  importRequestId,
  importRowId,
  service,
}: ImportAttachmentControllerDependencies & {
  readonly importRequestId: string;
  readonly importRowId: string | null;
}): Promise<ImportAttachmentResponse> {
  const targetResult = importAttachmentTargetSchema.safeParse({
    importRequestId,
    importRowId,
  });

  if (!targetResult.success) {
    return validationError(targetResult.error.issues[0]?.message);
  }

  try {
    const attachments = await service.list(context, targetResult.data);

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

function attachmentError(error: unknown): ImportAttachmentResponse {
  if (error instanceof ImportNotFoundError) {
    return { status: 404, body: { error: error.message } };
  }

  if (error instanceof InvalidImportError) {
    return { status: 400, body: { error: error.message } };
  }

  return {
    status: 500,
    body: { error: "Nao foi possivel processar o anexo" },
  };
}
