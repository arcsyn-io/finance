import type {
  EntryAttachment,
  EntryAttachmentWithPreview,
} from "../../domain/entry/entry-attachment";
import type {
  ListEntryAttachmentsCommand,
  UploadEntryAttachmentCommand,
} from "../commands/entry-attachment-commands";
import type { ApplicationContext } from "../context/application-context";
import type { EntryAttachmentRepository } from "../repositories/entry-attachment-repository";
import type { EntryRepository } from "../repositories/entry-repository";
import type { UnitOfWork } from "../unit-of-work/unit-of-work";
import { EntryNotFoundError } from "../../domain/entry/entry-errors";
import { ListEntryAttachmentsUseCase } from "../usecases/entry/list-entry-attachments.usecase";
import { UploadEntryAttachmentUseCase } from "../usecases/entry/upload-entry-attachment.usecase";
import { buildEntryAttachmentObjectPath } from "../../storage/entry-attachment-path";
import type { EntryAttachmentStorage } from "../../storage/entry-attachments";

export type EntryAttachmentServiceDependencies = {
  readonly attachmentRepository: EntryAttachmentRepository;
  readonly entryRepository: EntryRepository;
  readonly storage: EntryAttachmentStorage;
  readonly unitOfWork: UnitOfWork;
};

export class EntryAttachmentService {
  private readonly uploadUseCase: UploadEntryAttachmentUseCase;
  private readonly listUseCase: ListEntryAttachmentsUseCase;

  constructor(private readonly dependencies: EntryAttachmentServiceDependencies) {
    this.uploadUseCase = new UploadEntryAttachmentUseCase(
      dependencies.entryRepository,
      dependencies.attachmentRepository,
    );
    this.listUseCase = new ListEntryAttachmentsUseCase(
      dependencies.entryRepository,
      dependencies.attachmentRepository,
    );
  }

  async upload(
    context: ApplicationContext,
    command: UploadEntryAttachmentCommand,
  ): Promise<EntryAttachment> {
    const userId = context.requireUserPrincipal().id;
    const entry = await this.dependencies.entryRepository.findById(
      context,
      command.entryId,
    );

    if (!entry) {
      throw new EntryNotFoundError();
    }

    const objectPath = buildEntryAttachmentObjectPath({
      entryId: command.entryId,
      fileName: command.file.name,
      userId,
    });

    await this.dependencies.storage.upload({
      objectPath,
      file: command.file,
      contentType: command.file.type,
    });

    return this.dependencies.unitOfWork.execute(context, (transactionContext) =>
      this.uploadUseCase.execute(transactionContext, {
        entryId: command.entryId,
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
    command: ListEntryAttachmentsCommand,
  ): Promise<EntryAttachmentWithPreview[]> {
    return this.listUseCase.execute(context, command.entryId, (attachment) =>
      this.dependencies.storage.createSignedUrl(
        attachment.bucketName,
        attachment.objectPath,
      ),
    );
  }
}
