import type {
  ImportAttachment,
  ImportAttachmentWithPreview,
} from "../../domain/import/import-attachment";
import { InvalidImportError, ImportNotFoundError } from "../../domain/import/import-errors";
import type {
  ListImportAttachmentsCommand,
  UploadImportAttachmentCommand,
} from "../commands/import-attachment-commands";
import type { ApplicationContext } from "../context/application-context";
import type { ImportAttachmentRepository } from "../repositories/import-attachment-repository";
import type { ImportRepository } from "../repositories/import-repository";
import type { UnitOfWork } from "../unit-of-work/unit-of-work";
import { buildImportAttachmentObjectPath } from "../../storage/import-attachment-path";
import type { ImportAttachmentStorage } from "../../storage/import-attachments";

export type ImportAttachmentServiceDependencies = {
  readonly attachmentRepository: ImportAttachmentRepository;
  readonly importRepository: ImportRepository;
  readonly storage: ImportAttachmentStorage;
  readonly unitOfWork: UnitOfWork;
};

export class ImportAttachmentService {
  constructor(private readonly dependencies: ImportAttachmentServiceDependencies) {}

  async upload(
    context: ApplicationContext,
    command: UploadImportAttachmentCommand,
  ): Promise<ImportAttachment> {
    const userId = context.requireUserPrincipal().id;
    await this.requireTarget(context, command.importRequestId, command.importRowId);

    const objectPath = buildImportAttachmentObjectPath({
      fileName: command.file.name,
      importRequestId: command.importRequestId,
      importRowId: command.importRowId,
      userId,
    });

    await this.dependencies.storage.upload({
      objectPath,
      file: command.file,
      contentType: command.file.type,
    });

    return this.dependencies.unitOfWork.execute(context, (transactionContext) =>
      this.dependencies.attachmentRepository.create(transactionContext, {
        importRequestId: command.importRequestId,
        importRowId: command.importRowId,
        bucketName: this.dependencies.storage.getBucketName(),
        objectPath,
        originalFileName: command.file.name,
        mimeType: command.file.type,
        sizeBytes: command.file.size,
      }),
    );
  }

  async list(
    context: ApplicationContext,
    command: ListImportAttachmentsCommand,
  ): Promise<ImportAttachmentWithPreview[]> {
    await this.requireTarget(context, command.importRequestId, command.importRowId);
    const attachments =
      await this.dependencies.attachmentRepository.listByImportRequestId(
        context,
        command.importRequestId,
        { importRowId: command.importRowId },
      );

    return Promise.all(
      attachments.map(async (attachment) => ({
        ...attachment,
        signedUrl: await this.dependencies.storage.createSignedUrl(
          attachment.bucketName,
          attachment.objectPath,
        ),
      })),
    );
  }

  private async requireTarget(
    context: ApplicationContext,
    importRequestId: string,
    importRowId: string | null,
  ): Promise<void> {
    const request = await this.dependencies.importRepository.findById(
      context,
      importRequestId,
    );

    if (!request) {
      throw new ImportNotFoundError();
    }

    if (
      importRowId &&
      !request.rows.some((row) => row.id === importRowId)
    ) {
      throw new InvalidImportError("Linha nao pertence a esta importacao");
    }
  }
}
