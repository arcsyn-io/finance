import assert from "node:assert/strict";
import test from "node:test";

import type { EntryAttachment } from "../domain/entry/entry-attachment";
import { EntryNotFoundError } from "../domain/entry/entry-errors";
import { ApplicationContext } from "../server/context/application-context";
import type { EntryAttachmentRepository } from "../server/repositories/entry-attachment-repository";
import type { EntryRepository } from "../server/repositories/entry-repository";
import { EntryAttachmentService } from "../server/services/entry-attachment-service";
import type { EntryAttachmentStorage } from "../storage/entry-attachments";
import type { UnitOfWork } from "../server/unit-of-work/unit-of-work";
import type { Entry } from "../domain/entry/entry";

class FakeUnitOfWork implements UnitOfWork {
  async execute<T>(
    context: ApplicationContext,
    work: (context: ApplicationContext) => Promise<T>,
  ): Promise<T> {
    return work(context.withTransaction({ client: "tx" }));
  }
}

class FakeEntryRepository implements Pick<EntryRepository, "findById"> {
  entry: Entry | null = makeEntry();

  async findById(): Promise<Entry | null> {
    return this.entry;
  }
}

class FakeAttachmentRepository implements EntryAttachmentRepository {
  readonly attachments: EntryAttachment[] = [];

  async create(
    context: ApplicationContext,
    data: Parameters<EntryAttachmentRepository["create"]>[1],
  ): Promise<EntryAttachment> {
    const attachment: EntryAttachment = {
      ...data,
      id: `attachment-${this.attachments.length + 1}`,
      userId: context.requireUserPrincipal().id,
      createdAt: context.now,
      updatedAt: context.now,
    };
    this.attachments.push(attachment);
    return attachment;
  }

  async listByEntryId(
    context: ApplicationContext,
    entryId: string,
  ): Promise<EntryAttachment[]> {
    const userId = context.requireUserPrincipal().id;
    return this.attachments.filter(
      (attachment) =>
        attachment.userId === userId && attachment.entryId === entryId,
    );
  }
}

class FakeStorage implements EntryAttachmentStorage {
  signedBucketName: string | null = null;
  uploadedPath: string | null = null;

  getBucketName(): string {
    return "receipts";
  }

  async upload({
    objectPath,
  }: Parameters<EntryAttachmentStorage["upload"]>[0]): Promise<void> {
    this.uploadedPath = objectPath;
  }

  async createSignedUrl(
    bucketName: string,
    objectPath: string,
  ): Promise<string> {
    this.signedBucketName = bucketName;
    return `https://storage.local/${objectPath}`;
  }
}

function makeContext() {
  return ApplicationContext.user({
    principalId: "user-1",
    now: new Date("2026-07-11T12:00:00.000Z"),
  });
}

function makeService() {
  const entryRepository = new FakeEntryRepository();
  const attachmentRepository = new FakeAttachmentRepository();
  const storage = new FakeStorage();
  const service = new EntryAttachmentService({
    attachmentRepository,
    entryRepository: entryRepository as unknown as EntryRepository,
    storage,
    unitOfWork: new FakeUnitOfWork(),
  });

  return { attachmentRepository, entryRepository, service, storage };
}

test("service envia arquivo ao storage e registra anexo da transacao", async () => {
  const context = makeContext();
  const { attachmentRepository, service, storage } = makeService();
  const file = new File(["conteudo"], "comprovante.pdf", {
    type: "application/pdf",
  });

  const attachment = await service.upload(context, {
    entryId: "entry-1",
    file,
  });

  assert.equal(attachment.entryId, "entry-1");
  assert.equal(attachment.originalFileName, "comprovante.pdf");
  assert.equal(attachment.mimeType, "application/pdf");
  assert.equal(attachment.sizeBytes, 8);
  assert.equal(attachmentRepository.attachments.length, 1);
  assert.match(storage.uploadedPath ?? "", /^user-1\/entries\/entry-1\//);
});

test("service lista anexos com URL assinada", async () => {
  const context = makeContext();
  const { service, storage } = makeService();
  const file = new File(["img"], "foto.png", { type: "image/png" });

  await service.upload(context, { entryId: "entry-1", file });
  const attachments = await service.list(context, { entryId: "entry-1" });

  assert.equal(attachments.length, 1);
  assert.equal(attachments[0]?.signedUrl.startsWith("https://storage.local/"), true);
  assert.equal(storage.signedBucketName, "receipts");
});

test("service rejeita anexo para transacao inexistente", async () => {
  const context = makeContext();
  const { entryRepository, service, storage } = makeService();
  entryRepository.entry = null;

  await assert.rejects(
    () =>
      service.upload(context, {
        entryId: "entry-404",
        file: new File(["x"], "comprovante.pdf", { type: "application/pdf" }),
      }),
    EntryNotFoundError,
  );
  assert.equal(storage.uploadedPath, null);
});

function makeEntry(): Entry {
  return {
    id: "entry-1",
    userId: "user-1",
    legacyId: null,
    walletId: "wallet-1",
    categoryId: "category-1",
    transferId: null,
    economicEventId: null,
    nature: "OPERATIONAL",
    direction: "OUT",
    amountCents: 100,
    occurredOn: "2026-07-11",
    description: "Conta",
    externalId: null,
    economicEvent: "CONSUMPTION",
    receiptPath: null,
    deletedAt: null,
    createdAt: new Date("2026-07-11T12:00:00.000Z"),
    updatedAt: new Date("2026-07-11T12:00:00.000Z"),
    walletName: null,
    categoryName: null,
    categoryColor: null,
    categoryIcon: null,
  };
}
