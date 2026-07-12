import { z } from "zod";

const maxFileSizeBytes = 10 * 1024 * 1024;
const allowedMimeTypes = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export const importAttachmentTargetSchema = z.object({
  importRequestId: z.string().uuid("Importacao invalida"),
  importRowId: z.string().uuid("Linha de importacao invalida").nullable(),
});

export function validateImportAttachmentFile(value: FormDataEntryValue | null): File {
  if (!(value instanceof File)) {
    throw new Error("Arquivo obrigatorio");
  }

  if (value.size <= 0) {
    throw new Error("Arquivo vazio");
  }

  if (value.size > maxFileSizeBytes) {
    throw new Error("Arquivo deve ter no maximo 10 MB");
  }

  if (!allowedMimeTypes.has(value.type)) {
    throw new Error("Formato de arquivo nao suportado");
  }

  return value;
}
