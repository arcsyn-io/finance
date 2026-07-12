import { randomUUID } from "node:crypto";

export function buildImportAttachmentObjectPath({
  fileName,
  importRequestId,
  importRowId,
  userId,
}: {
  readonly fileName: string;
  readonly importRequestId: string;
  readonly importRowId: string | null;
  readonly userId: string;
}): string {
  const extension = fileName.split(".").pop()?.toLowerCase() ?? "bin";
  const safeExtension = extension.replace(/[^a-z0-9]/g, "") || "bin";
  const targetPath = importRowId ? `rows/${importRowId}` : "request";

  return `${userId}/imports/${importRequestId}/${targetPath}/${randomUUID()}.${safeExtension}`;
}
