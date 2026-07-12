import "server-only";

import { importAttachmentRepository } from "@/server/repositories/import-attachment-repository";
import { importRepository } from "@/server/repositories/import-repository";
import { ImportAttachmentService } from "@/server/services/import-attachment-service";
import { unitOfWork } from "@/server/unit-of-work/drizzle-unit-of-work";
import { importAttachmentStorage } from "@/storage/import-attachments";

export function createImportAttachmentService(): ImportAttachmentService {
  return new ImportAttachmentService({
    attachmentRepository: importAttachmentRepository,
    importRepository,
    storage: importAttachmentStorage,
    unitOfWork,
  });
}
