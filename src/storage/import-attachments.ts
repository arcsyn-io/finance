import "server-only";

import { getEnv } from "@/lib/env";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export type UploadImportAttachmentInput = {
  readonly objectPath: string;
  readonly file: File;
  readonly contentType: string;
};

export interface ImportAttachmentStorage {
  getBucketName(): string;

  upload(input: UploadImportAttachmentInput): Promise<void>;

  createSignedUrl(bucketName: string, objectPath: string): Promise<string>;
}

export class SupabaseImportAttachmentStorage
  implements ImportAttachmentStorage
{
  getBucketName(): string {
    return getEnv().SUPABASE_STORAGE_RECEIPTS_BUCKET;
  }

  async upload(input: UploadImportAttachmentInput): Promise<void> {
    const supabase = createServiceRoleClient();
    const { error } = await supabase.storage
      .from(this.getBucketName())
      .upload(input.objectPath, input.file, {
        contentType: input.contentType,
        upsert: false,
      });

    if (error) {
      throw new Error("Nao foi possivel enviar o anexo da importacao.");
    }
  }

  async createSignedUrl(
    bucketName: string,
    objectPath: string,
  ): Promise<string> {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(objectPath, 60 * 5);

    if (error) {
      throw new Error("Nao foi possivel gerar preview do anexo da importacao.");
    }

    return data.signedUrl;
  }
}

export const importAttachmentStorage = new SupabaseImportAttachmentStorage();
