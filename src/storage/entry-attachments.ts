import "server-only";

import { createServiceRoleClient } from "@/lib/supabase/service-role";
export { buildEntryAttachmentObjectPath } from "@/storage/entry-attachment-path";

export type UploadEntryAttachmentInput = {
  readonly objectPath: string;
  readonly file: File;
  readonly contentType: string;
};

export interface EntryAttachmentStorage {
  getBucketName(): string;

  upload(input: UploadEntryAttachmentInput): Promise<void>;

  createSignedUrl(bucketName: string, objectPath: string): Promise<string>;
}

export class SupabaseEntryAttachmentStorage
  implements EntryAttachmentStorage
{
  getBucketName(): string {
    return process.env.SUPABASE_STORAGE_RECEIPTS_BUCKET || "receipts";
  }

  async upload(input: UploadEntryAttachmentInput): Promise<void> {
    const supabase = createServiceRoleClient();
    const { error } = await supabase.storage
      .from(this.getBucketName())
      .upload(input.objectPath, input.file, {
        contentType: input.contentType,
        upsert: false,
      });

    if (error) {
      throw new Error("Nao foi possivel enviar o anexo.");
    }
  }

  async createSignedUrl(bucketName: string, objectPath: string): Promise<string> {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(objectPath, 60 * 5);

    if (error) {
      throw new Error("Nao foi possivel gerar preview do anexo.");
    }

    return data.signedUrl;
  }
}

export const entryAttachmentStorage = new SupabaseEntryAttachmentStorage();
