export type EntryAttachment = {
  readonly id: string;
  readonly userId: string;
  readonly entryId: string;
  readonly bucketName: string;
  readonly objectPath: string;
  readonly originalFileName: string;
  readonly mimeType: string;
  readonly sizeBytes: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

export type EntryAttachmentWithPreview = EntryAttachment & {
  readonly signedUrl: string;
};
