import { entryAttachmentRepository } from "@/server/repositories/entry-attachment-repository";
import { entryRepository } from "@/server/repositories/entry-repository";
import { EntryAttachmentService } from "@/server/services/entry-attachment-service";
import { unitOfWork } from "@/server/unit-of-work/drizzle-unit-of-work";
import { entryAttachmentStorage } from "@/storage/entry-attachments";

export function createEntryAttachmentService(): EntryAttachmentService {
  return new EntryAttachmentService({
    attachmentRepository: entryAttachmentRepository,
    entryRepository,
    storage: entryAttachmentStorage,
    unitOfWork,
  });
}
