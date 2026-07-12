export type ImportAttachmentScope = "IMPORT" | "ROW";

export type ImportAttachment = {
  readonly id: string;
  readonly userId: string;
  readonly importRequestId: string;
  readonly importRowId: string | null;
  readonly bucketName: string;
  readonly objectPath: string;
  readonly originalFileName: string;
  readonly mimeType: string;
  readonly sizeBytes: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

export type ImportAttachmentWithPreview = ImportAttachment & {
  readonly signedUrl: string;
};
