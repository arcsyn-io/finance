import { z } from "zod";

const allowedMimeTypes = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

const maxFileSizeBytes = 10 * 1024 * 1024;

export const entryAttachmentEntryIdSchema = z.object({
  entryId: z.string().uuid("Transacao invalida"),
});

export function validateEntryAttachmentFile(file: unknown): File {
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Arquivo e obrigatorio");
  }

  if (file.size > maxFileSizeBytes) {
    throw new Error("Arquivo deve ter no maximo 10 MB");
  }

  if (!allowedMimeTypes.includes(file.type as (typeof allowedMimeTypes)[number])) {
    throw new Error("Tipo de arquivo nao permitido");
  }

  return file;
}
