import "server-only";

import { randomUUID } from "node:crypto";
import { getEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

const DEFAULT_SIGNED_URL_TTL_SECONDS = 60 * 5;

export function getReceiptsBucketName() {
  return getEnv().SUPABASE_STORAGE_RECEIPTS_BUCKET;
}

export function buildReceiptObjectPath({
  userId,
  entryId,
  fileName,
}: {
  userId: string;
  entryId: string;
  fileName: string;
}) {
  const extension = fileName.split(".").pop()?.toLowerCase() ?? "bin";
  const safeExtension = extension.replace(/[^a-z0-9]/g, "") || "bin";

  return `${userId}/entries/${entryId}/${randomUUID()}.${safeExtension}`;
}

export async function createReceiptSignedUrl(
  objectPath: string,
  expiresIn = DEFAULT_SIGNED_URL_TTL_SECONDS,
) {
  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from(getReceiptsBucketName())
    .createSignedUrl(objectPath, expiresIn);

  if (error) {
    throw new Error("Nao foi possivel gerar a URL assinada do comprovante.");
  }

  return data.signedUrl;
}
