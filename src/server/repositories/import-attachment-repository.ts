import "server-only";

import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import { importAttachments } from "@/db/schema";
import type { ImportAttachment } from "@/domain/import/import-attachment";
import type { ApplicationContext } from "@/server/context/application-context";
import { resolveDatabaseClient } from "@/server/repositories/database-client";

export type CreateImportAttachmentData = {
  readonly importRequestId: string;
  readonly importRowId: string | null;
  readonly bucketName: string;
  readonly objectPath: string;
  readonly originalFileName: string;
  readonly mimeType: string;
  readonly sizeBytes: number;
};

export interface ImportAttachmentRepository {
  create(
    context: ApplicationContext,
    data: CreateImportAttachmentData,
  ): Promise<ImportAttachment>;

  listByImportRequestId(
    context: ApplicationContext,
    importRequestId: string,
    options: { readonly importRowId: string | null },
  ): Promise<ImportAttachment[]>;
}

export class DrizzleImportAttachmentRepository
  implements ImportAttachmentRepository
{
  async create(
    context: ApplicationContext,
    data: CreateImportAttachmentData,
  ): Promise<ImportAttachment> {
    const userId = context.requireUserPrincipal().id;
    const database = resolveDatabaseClient(context, db);
    const [row] = await database
      .insert(importAttachments)
      .values({
        userId,
        importRequestId: data.importRequestId,
        importRowId: data.importRowId,
        bucketName: data.bucketName,
        objectPath: data.objectPath,
        originalFileName: data.originalFileName,
        mimeType: data.mimeType,
        sizeBytes: data.sizeBytes,
      })
      .returning();

    return mapRow(row);
  }

  async listByImportRequestId(
    context: ApplicationContext,
    importRequestId: string,
    options: { readonly importRowId: string | null },
  ): Promise<ImportAttachment[]> {
    const userId = context.requireUserPrincipal().id;
    const database = resolveDatabaseClient(context, db);
    const rowCondition =
      options.importRowId === null
        ? isNull(importAttachments.importRowId)
        : eq(importAttachments.importRowId, options.importRowId);
    const rows = await database
      .select()
      .from(importAttachments)
      .where(
        and(
          eq(importAttachments.userId, userId),
          eq(importAttachments.importRequestId, importRequestId),
          rowCondition,
        ),
      )
      .orderBy(desc(importAttachments.createdAt));

    return rows.map(mapRow);
  }
}

function mapRow(row: typeof importAttachments.$inferSelect): ImportAttachment {
  return {
    id: row.id,
    userId: row.userId,
    importRequestId: row.importRequestId,
    importRowId: row.importRowId,
    bucketName: row.bucketName,
    objectPath: row.objectPath,
    originalFileName: row.originalFileName,
    mimeType: row.mimeType,
    sizeBytes: row.sizeBytes,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export const importAttachmentRepository =
  new DrizzleImportAttachmentRepository();
