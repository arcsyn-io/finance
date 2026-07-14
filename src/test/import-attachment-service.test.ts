import assert from "node:assert/strict";
import test from "node:test";

import type { ImportAttachment } from "../domain/import/import-attachment";
import type { ImportRequest } from "../domain/import/import";
import { InvalidImportError } from "../domain/import/import-errors";
import { ApplicationContext } from "../server/context/application-context";
import type { ImportAttachmentRepository } from "../server/repositories/import-attachment-repository";
import type { ImportRepository } from "../server/repositories/import-repository";
import { ImportAttachmentService } from "../server/services/import-attachment-service";
import type { UnitOfWork } from "../server/unit-of-work/unit-of-work";
import type { ImportAttachmentStorage } from "../storage/import-attachments";

class FakeUnitOfWork implements UnitOfWork {
  async execute<T>(
    context: ApplicationContext,
    work: (context: ApplicationContext) => Promise<T>,
  ): Promise<T> {
    return work(context.withTransaction({ client: "tx" }));
  }
}

class FakeImportRepository implements Pick<ImportRepository, "findById"> {
  request: ImportRequest | null = makeImportRequest();

  async findById(): Promise<ImportRequest | null> {
    return this.request;
  }
}

class FakeAttachmentRepository implements ImportAttachmentRepository {
  readonly attachments: ImportAttachment[] = [];

  async create(
    context: ApplicationContext,
    data: Parameters<ImportAttachmentRepository["create"]>[1],
  ): Promise<ImportAttachment> {
    const attachment: ImportAttachment = {
      ...data,
      id: `attachment-${this.attachments.length + 1}`,
      userId: context.requireUserPrincipal().id,
      createdAt: context.now,
      updatedAt: context.now,
    };
    this.attachments.push(attachment);
    return attachment;
  }

  async listByImportRequestId(
    context: ApplicationContext,
    importRequestId: string,
    options: { readonly importRowId: string | null },
  ): Promise<ImportAttachment[]> {
    const userId = context.requireUserPrincipal().id;
    return this.attachments.filter(
      (attachment) =>
        attachment.userId === userId &&
        attachment.importRequestId === importRequestId &&
        attachment.importRowId === options.importRowId,
    );
  }

  async listAllByImportRequestId(
    context: ApplicationContext,
    importRequestId: string,
  ): Promise<ImportAttachment[]> {
    const userId = context.requireUserPrincipal().id;
    return this.attachments.filter(
      (attachment) =>
        attachment.userId === userId &&
        attachment.importRequestId === importRequestId,
    );
  }
}

class FakeStorage implements ImportAttachmentStorage {
  signedBucketName: string | null = null;
  uploadedPath: string | null = null;

  getBucketName(): string {
    return "receipts";
  }

  async upload({
    objectPath,
  }: Parameters<ImportAttachmentStorage["upload"]>[0]): Promise<void> {
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
    now: new Date("2026-07-12T12:00:00.000Z"),
  });
}

function makeService() {
  const attachmentRepository = new FakeAttachmentRepository();
  const importRepository = new FakeImportRepository();
  const storage = new FakeStorage();
  const service = new ImportAttachmentService({
    attachmentRepository,
    importRepository: importRepository as unknown as ImportRepository,
    storage,
    unitOfWork: new FakeUnitOfWork(),
  });

  return { attachmentRepository, importRepository, service, storage };
}

test("service registra anexo global da importacao", async () => {
  const context = makeContext();
  const { attachmentRepository, service, storage } = makeService();

  const attachment = await service.upload(context, {
    importRequestId: "import-1",
    importRowId: null,
    file: new File(["pdf"], "fatura.pdf", { type: "application/pdf" }),
  });

  assert.equal(attachment.importRequestId, "import-1");
  assert.equal(attachment.importRowId, null);
  assert.equal(attachment.originalFileName, "fatura.pdf");
  assert.match(storage.uploadedPath ?? "", /^user-1\/imports\/import-1\/request\//);
  assert.equal(attachmentRepository.attachments.length, 1);
});

test("service registra e lista anexo de linha da importacao", async () => {
  const context = makeContext();
  const { service, storage } = makeService();

  await service.upload(context, {
    importRequestId: "import-1",
    importRowId: "row-1",
    file: new File(["img"], "item.png", { type: "image/png" }),
  });

  const attachments = await service.list(context, {
    importRequestId: "import-1",
    importRowId: "row-1",
  });

  assert.equal(attachments.length, 1);
  assert.equal(attachments[0]?.signedUrl.startsWith("https://storage.local/"), true);
  assert.equal(storage.signedBucketName, "receipts");
});

test("service rejeita anexo de linha que nao pertence a importacao", async () => {
  const context = makeContext();
  const { service, storage } = makeService();

  await assert.rejects(
    () =>
      service.upload(context, {
        importRequestId: "import-1",
        importRowId: "row-404",
        file: new File(["x"], "item.pdf", { type: "application/pdf" }),
      }),
    InvalidImportError,
  );
  assert.equal(storage.uploadedPath, null);
});

function makeImportRequest(): ImportRequest {
  return {
    id: "import-1",
    userId: "user-1",
    source: "NUBANK_CSV",
    status: "PENDING_REVIEW",
    fileName: "nubank.csv",
    nature: null,
    economicEvent: null,
    confirmedAt: null,
    defaultWalletId: null,
    defaultWalletName: null,
    defaultCategoryId: null,
    defaultCategoryName: null,
    attachmentCount: 0,
    createdAt: new Date("2026-07-12T12:00:00.000Z"),
    updatedAt: new Date("2026-07-12T12:00:00.000Z"),
    rows: [
      {
        id: "row-1",
        importRequestId: "import-1",
        userId: "user-1",
        rowNumber: 1,
        occurredOn: "2026-07-12",
        description: "Item",
        amountCents: 1000,
        direction: "OUT",
        nature: null,
        walletId: null,
        walletName: null,
        categoryId: null,
        categoryName: null,
        categoryColor: null,
        categoryIcon: null,
        externalId: null,
        valid: true,
        validationErrors: null,
        economicEvent: null,
        entryId: null,
        ignoredAt: null,
        attachmentCount: 0,
        createdAt: new Date("2026-07-12T12:00:00.000Z"),
        updatedAt: new Date("2026-07-12T12:00:00.000Z"),
      },
    ],
  };
}
