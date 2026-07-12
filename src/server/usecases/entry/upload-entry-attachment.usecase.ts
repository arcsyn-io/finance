import type { EntryAttachment } from "../../../domain/entry/entry-attachment";
import { EntryNotFoundError } from "../../../domain/entry/entry-errors";
import type { ApplicationContext } from "../../context/application-context";
import type { EntryAttachmentRepository } from "../../repositories/entry-attachment-repository";
import type { EntryRepository } from "../../repositories/entry-repository";

export type UploadEntryAttachmentUseCaseInput = {
  readonly entryId: string;
  readonly bucketName: string;
  readonly objectPath: string;
  readonly originalFileName: string;
  readonly mimeType: string;
  readonly sizeBytes: number;
};

export class UploadEntryAttachmentUseCase {
  constructor(
    private readonly entryRepository: Pick<EntryRepository, "findById">,
    private readonly attachmentRepository: EntryAttachmentRepository,
  ) {}

  async execute(
    context: ApplicationContext,
    input: UploadEntryAttachmentUseCaseInput,
  ): Promise<EntryAttachment> {
    const entry = await this.entryRepository.findById(context, input.entryId);

    if (!entry) {
      throw new EntryNotFoundError();
    }

    return this.attachmentRepository.create(context, {
      entryId: input.entryId,
      bucketName: input.bucketName,
      objectPath: input.objectPath,
      originalFileName: input.originalFileName,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
    });
  }
}
