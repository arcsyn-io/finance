import type {
  EntryAttachment,
  EntryAttachmentWithPreview,
} from "../../../domain/entry/entry-attachment";
import { EntryNotFoundError } from "../../../domain/entry/entry-errors";
import type { ApplicationContext } from "../../context/application-context";
import type { EntryAttachmentRepository } from "../../repositories/entry-attachment-repository";
import type { EntryRepository } from "../../repositories/entry-repository";

export class ListEntryAttachmentsUseCase {
  constructor(
    private readonly entryRepository: Pick<EntryRepository, "findById">,
    private readonly attachmentRepository: EntryAttachmentRepository,
  ) {}

  async execute(
    context: ApplicationContext,
    entryId: string,
    createSignedUrl: (attachment: EntryAttachment) => Promise<string>,
  ): Promise<EntryAttachmentWithPreview[]> {
    const entry = await this.entryRepository.findById(context, entryId);

    if (!entry) {
      throw new EntryNotFoundError();
    }

    const attachments = await this.attachmentRepository.listByEntryId(
      context,
      entryId,
    );

    return Promise.all(
      attachments.map(async (attachment) => ({
        ...attachment,
        signedUrl: await createSignedUrl(attachment),
      })),
    );
  }
}
