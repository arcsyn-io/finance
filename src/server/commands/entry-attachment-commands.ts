export type UploadEntryAttachmentCommand = {
  readonly entryId: string;
  readonly file: File;
};

export type ListEntryAttachmentsCommand = {
  readonly entryId: string;
};
