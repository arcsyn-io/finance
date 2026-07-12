export type UploadImportAttachmentCommand = {
  readonly importRequestId: string;
  readonly importRowId: string | null;
  readonly file: File;
};

export type ListImportAttachmentsCommand = {
  readonly importRequestId: string;
  readonly importRowId: string | null;
};
