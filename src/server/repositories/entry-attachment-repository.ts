import "server-only";

import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { entryAttachments } from "@/db/schema";
import type { EntryAttachment } from "@/domain/entry/entry-attachment";
import type { ApplicationContext } from "@/server/context/application-context";
import { resolveDatabaseClient } from "@/server/repositories/database-client";

export type CreateEntryAttachmentData = {
  readonly entryId: string;
  readonly bucketName: string;
  readonly objectPath: string;
  readonly originalFileName: string;
  readonly mimeType: string;
  readonly sizeBytes: number;
};

export interface EntryAttachmentRepository {
  create(
    context: ApplicationContext,
    data: CreateEntryAttachmentData,
  ): Promise<EntryAttachment>;

  createMany(
    context: ApplicationContext,
    data: readonly CreateEntryAttachmentData[],
  ): Promise<readonly EntryAttachment[]>;

  listByEntryId(
    context: ApplicationContext,
    entryId: string,
  ): Promise<EntryAttachment[]>;
}

export class DrizzleEntryAttachmentRepository
  implements EntryAttachmentRepository
{
  async create(
    context: ApplicationContext,
    data: CreateEntryAttachmentData,
  ): Promise<EntryAttachment> {
    const userId = context.requireUserPrincipal().id;
    const database = resolveDatabaseClient(context, db);
    const [row] = await database
      .insert(entryAttachments)
      .values({
        userId,
        entryId: data.entryId,
        bucketName: data.bucketName,
        objectPath: data.objectPath,
        originalFileName: data.originalFileName,
        mimeType: data.mimeType,
        sizeBytes: data.sizeBytes,
      })
      .returning();

    return mapRow(row);
  }

  async createMany(
    context: ApplicationContext,
    data: readonly CreateEntryAttachmentData[],
  ): Promise<readonly EntryAttachment[]> {
    if (data.length === 0) return [];

    const userId = context.requireUserPrincipal().id;
    const database = resolveDatabaseClient(context, db);
    const rows = await database
      .insert(entryAttachments)
      .values(data.map((attachment) => ({ userId, ...attachment })))
      .returning();

    return rows.map(mapRow);
  }

  async listByEntryId(
    context: ApplicationContext,
    entryId: string,
  ): Promise<EntryAttachment[]> {
    const userId = context.requireUserPrincipal().id;
    const database = resolveDatabaseClient(context, db);
    const rows = await database
      .select()
      .from(entryAttachments)
      .where(
        and(
          eq(entryAttachments.userId, userId),
          eq(entryAttachments.entryId, entryId),
        ),
      )
      .orderBy(desc(entryAttachments.createdAt));

    return rows.map(mapRow);
  }
}

function mapRow(row: typeof entryAttachments.$inferSelect): EntryAttachment {
  return {
    id: row.id,
    userId: row.userId,
    entryId: row.entryId,
    bucketName: row.bucketName,
    objectPath: row.objectPath,
    originalFileName: row.originalFileName,
    mimeType: row.mimeType,
    sizeBytes: row.sizeBytes,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export const entryAttachmentRepository =
  new DrizzleEntryAttachmentRepository();
