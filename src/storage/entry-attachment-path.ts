import { randomUUID } from "node:crypto";

export function buildEntryAttachmentObjectPath({
  entryId,
  fileName,
  userId,
}: {
  readonly entryId: string;
  readonly fileName: string;
  readonly userId: string;
}): string {
  const extension = fileName.split(".").pop()?.toLowerCase() ?? "bin";
  const safeExtension = extension.replace(/[^a-z0-9]/g, "") || "bin";

  return `${userId}/entries/${entryId}/${randomUUID()}.${safeExtension}`;
}
