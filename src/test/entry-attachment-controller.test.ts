import assert from "node:assert/strict";
import test from "node:test";

import type {
  EntryAttachment,
  EntryAttachmentWithPreview,
} from "../domain/entry/entry-attachment";
import { EntryNotFoundError } from "../domain/entry/entry-errors";
import { ApplicationContext } from "../server/context/application-context";
import {
  listEntryAttachmentsJson,
  uploadEntryAttachmentJson,
} from "../server/controllers/entry-attachment-controller";
import type {
  UploadEntryAttachmentCommand,
  ListEntryAttachmentsCommand,
} from "../server/commands/entry-attachment-commands";

class FakeService {
  uploadCommand: UploadEntryAttachmentCommand | null = null;
  listCommand: ListEntryAttachmentsCommand | null = null;
  notFound = false;

  async upload(
    context: ApplicationContext,
    command: UploadEntryAttachmentCommand,
  ): Promise<EntryAttachment> {
    this.uploadCommand = command;
    if (this.notFound) throw new EntryNotFoundError();
    return makeAttachment(context, command.entryId, command.file);
  }

  async list(
    context: ApplicationContext,
    command: ListEntryAttachmentsCommand,
  ): Promise<EntryAttachmentWithPreview[]> {
    this.listCommand = command;
    if (this.notFound) throw new EntryNotFoundError();
    return [
      {
        ...makeAttachment(
          context,
          command.entryId,
          new File(["x"], "comprovante.pdf", { type: "application/pdf" }),
        ),
        signedUrl: "https://storage.local/file.pdf",
      },
    ];
  }
}

function makeContext() {
  return ApplicationContext.user({
    principalId: "user-1",
    now: new Date("2026-07-11T12:00:00.000Z"),
  });
}

test("controller recebe FormData e cria anexo", async () => {
  const service = new FakeService();
  const formData = new FormData();
  formData.set("file", new File(["abc"], "comprovante.pdf", { type: "application/pdf" }));

  const response = await uploadEntryAttachmentJson({
    context: makeContext(),
    service,
    entryId: "00000000-0000-0000-0000-000000000001",
    formData,
  });

  assert.equal(response.status, 201);
  assert.equal(response.body.attachment?.originalFileName, "comprovante.pdf");
  assert.equal(service.uploadCommand?.entryId, "00000000-0000-0000-0000-000000000001");
});

test("controller lista anexos com preview", async () => {
  const service = new FakeService();

  const response = await listEntryAttachmentsJson({
    context: makeContext(),
    service,
    entryId: "00000000-0000-0000-0000-000000000001",
  });

  assert.equal(response.status, 200);
  assert.equal(response.body.attachments?.[0]?.signedUrl, "https://storage.local/file.pdf");
  assert.equal(service.listCommand?.entryId, "00000000-0000-0000-0000-000000000001");
});

test("controller retorna 404 para transacao inexistente", async () => {
  const service = new FakeService();
  service.notFound = true;
  const formData = new FormData();
  formData.set("file", new File(["abc"], "comprovante.pdf", { type: "application/pdf" }));

  const response = await uploadEntryAttachmentJson({
    context: makeContext(),
    service,
    entryId: "00000000-0000-0000-0000-000000000404",
    formData,
  });

  assert.equal(response.status, 404);
  assert.equal(response.body.error, "Lancamento nao encontrado");
});

function makeAttachment(
  context: ApplicationContext,
  entryId: string,
  file: File,
): EntryAttachment {
  return {
    id: "attachment-1",
    userId: context.requireUserPrincipal().id,
    entryId,
    bucketName: "receipts",
    objectPath: `user-1/entries/${entryId}/file.pdf`,
    originalFileName: file.name,
    mimeType: file.type,
    sizeBytes: file.size,
    createdAt: context.now,
    updatedAt: context.now,
  };
}
