import { and, asc, eq, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { categories } from "@/db/schema";
import { Category, CategoryType } from "@/domain/category/category";
import { ApplicationContext } from "@/server/context/application-context";
import { resolveDatabaseClient } from "@/server/repositories/database-client";

export type CreateCategoryData = {
  readonly name: string;
  readonly type: CategoryType;
};

export type UpdateCategoryData = {
  readonly name: string;
  readonly type: CategoryType;
  readonly active: boolean;
};

export interface CategoryRepository {
  list(
    context: ApplicationContext,
    options: { includeInactive: boolean },
  ): Promise<Category[]>;

  listActiveByType(
    context: ApplicationContext,
    type: CategoryType,
  ): Promise<Category[]>;

  findById(context: ApplicationContext, id: string): Promise<Category | null>;

  findByName(
    context: ApplicationContext,
    name: string,
  ): Promise<Category | null>;

  create(
    context: ApplicationContext,
    data: CreateCategoryData,
  ): Promise<Category>;

  update(
    context: ApplicationContext,
    id: string,
    data: UpdateCategoryData,
  ): Promise<Category>;

  setActive(
    context: ApplicationContext,
    id: string,
    active: boolean,
  ): Promise<Category>;
}

export class DrizzleCategoryRepository implements CategoryRepository {
  async list(
    context: ApplicationContext,
    options: { includeInactive: boolean },
  ): Promise<Category[]> {
    const userId = context.requireUserPrincipal().id;
    const client = resolveDatabaseClient(context, db);
    const rows = await client
      .select()
      .from(categories)
      .where(
        options.includeInactive
          ? eq(categories.userId, userId)
          : and(eq(categories.userId, userId), eq(categories.active, true)),
      )
      .orderBy(asc(categories.name));

    return rows.map(mapRowToCategory);
  }

  async listActiveByType(
    context: ApplicationContext,
    type: CategoryType,
  ): Promise<Category[]> {
    const userId = context.requireUserPrincipal().id;
    const client = resolveDatabaseClient(context, db);
    const rows = await client
      .select()
      .from(categories)
      .where(
        and(
          eq(categories.userId, userId),
          eq(categories.active, true),
          eq(categories.type, type),
        ),
      )
      .orderBy(asc(categories.name));

    return rows.map(mapRowToCategory);
  }

  async findById(
    context: ApplicationContext,
    id: string,
  ): Promise<Category | null> {
    const userId = context.requireUserPrincipal().id;
    const client = resolveDatabaseClient(context, db);
    const [row] = await client
      .select()
      .from(categories)
      .where(and(eq(categories.userId, userId), eq(categories.id, id)))
      .limit(1);

    return row ? mapRowToCategory(row) : null;
  }

  async findByName(
    context: ApplicationContext,
    name: string,
  ): Promise<Category | null> {
    const userId = context.requireUserPrincipal().id;
    const client = resolveDatabaseClient(context, db);
    const [row] = await client
      .select()
      .from(categories)
      .where(
        and(
          eq(categories.userId, userId),
          sql`lower(${categories.name}) = ${name.toLowerCase()}`,
        ),
      )
      .limit(1);

    return row ? mapRowToCategory(row) : null;
  }

  async create(
    context: ApplicationContext,
    data: CreateCategoryData,
  ): Promise<Category> {
    const userId = context.requireUserPrincipal().id;
    const client = resolveDatabaseClient(context, db);
    const [row] = await client
      .insert(categories)
      .values({
        userId,
        name: data.name,
        type: data.type,
        active: true,
        archivedAt: null,
      })
      .returning();

    return mapRowToCategory(row);
  }

  async update(
    context: ApplicationContext,
    id: string,
    data: UpdateCategoryData,
  ): Promise<Category> {
    const userId = context.requireUserPrincipal().id;
    const client = resolveDatabaseClient(context, db);
    const [row] = await client
      .update(categories)
      .set({
        name: data.name,
        type: data.type,
        active: data.active,
        archivedAt: data.active ? null : context.now,
        updatedAt: context.now,
      })
      .where(and(eq(categories.userId, userId), eq(categories.id, id)))
      .returning();

    return mapRowToCategory(row);
  }

  async setActive(
    context: ApplicationContext,
    id: string,
    active: boolean,
  ): Promise<Category> {
    const userId = context.requireUserPrincipal().id;
    const client = resolveDatabaseClient(context, db);
    const [row] = await client
      .update(categories)
      .set({
        active,
        archivedAt: active ? null : context.now,
        updatedAt: context.now,
      })
      .where(and(eq(categories.userId, userId), eq(categories.id, id)))
      .returning();

    return mapRowToCategory(row);
  }
}

function mapRowToCategory(row: typeof categories.$inferSelect): Category {
  return {
    id: row.id,
    userId: row.userId,
    legacyId: row.legacyId,
    name: row.name,
    type: row.type,
    active: row.active,
    archivedAt: row.archivedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export const categoryRepository = new DrizzleCategoryRepository();
