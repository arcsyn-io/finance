import { Category, CategoryType } from "@/domain/category/category";
import {
  normalizeCategoryColor,
  normalizeCategoryIcon,
} from "@/domain/category/category-visual";
import { ApplicationContext } from "@/server/context/application-context";
import { createClient } from "@/lib/supabase/server";

export type CreateCategoryData = {
  readonly name: string;
  readonly type: CategoryType;
  readonly icon: string;
  readonly color: string;
  readonly active: boolean;
};

export type UpdateCategoryData = {
  readonly name: string;
  readonly type: CategoryType;
  readonly icon: string;
  readonly color: string;
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

type CategoryRow = {
  id: string;
  user_id: string;
  legacy_id: number | null;
  name: string;
  type: CategoryType;
  icon?: string | null;
  color?: string | null;
  active: boolean;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
};

export class SupabaseCategoryRepository implements CategoryRepository {
  async list(
    context: ApplicationContext,
    options: { includeInactive: boolean },
  ): Promise<Category[]> {
    const userId = context.requireUserPrincipal().id;
    const supabase = await createClient();
    let query = supabase
      .from("categories")
      .select("*")
      .eq("user_id", userId)
      .order("name", { ascending: true });

    if (!options.includeInactive) {
      query = query.eq("active", true);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return (data as CategoryRow[]).map(mapRowToCategory);
  }

  async listActiveByType(
    context: ApplicationContext,
    type: CategoryType,
  ): Promise<Category[]> {
    const userId = context.requireUserPrincipal().id;
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("user_id", userId)
      .eq("active", true)
      .eq("type", type)
      .order("name", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return (data as CategoryRow[]).map(mapRowToCategory);
  }

  async findById(
    context: ApplicationContext,
    id: string,
  ): Promise<Category | null> {
    const userId = context.requireUserPrincipal().id;
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("user_id", userId)
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data ? mapRowToCategory(data as CategoryRow) : null;
  }

  async findByName(
    context: ApplicationContext,
    name: string,
  ): Promise<Category | null> {
    const categories = await this.list(context, { includeInactive: true });
    const normalizedName = name.toLowerCase();

    return (
      categories.find(
        (category) => category.name.toLowerCase() === normalizedName,
      ) ?? null
    );
  }

  async create(
    context: ApplicationContext,
    data: CreateCategoryData,
  ): Promise<Category> {
    const userId = context.requireUserPrincipal().id;
    const supabase = await createClient();
    const { data: row, error } = await supabase
      .from("categories")
      .insert({
        user_id: userId,
        name: data.name,
        type: data.type,
        icon: data.icon,
        color: data.color,
        active: data.active,
        archived_at: data.active ? null : context.now.toISOString(),
      })
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return mapRowToCategory(row as CategoryRow);
  }

  async update(
    context: ApplicationContext,
    id: string,
    data: UpdateCategoryData,
  ): Promise<Category> {
    const userId = context.requireUserPrincipal().id;
    const supabase = await createClient();
    const { data: row, error } = await supabase
      .from("categories")
      .update({
        name: data.name,
        type: data.type,
        icon: data.icon,
        color: data.color,
        active: data.active,
        archived_at: data.active ? null : context.now.toISOString(),
        updated_at: context.now.toISOString(),
      })
      .eq("user_id", userId)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return mapRowToCategory(row as CategoryRow);
  }

  async setActive(
    context: ApplicationContext,
    id: string,
    active: boolean,
  ): Promise<Category> {
    const userId = context.requireUserPrincipal().id;
    const supabase = await createClient();
    const { data: row, error } = await supabase
      .from("categories")
      .update({
        active,
        archived_at: active ? null : context.now.toISOString(),
        updated_at: context.now.toISOString(),
      })
      .eq("user_id", userId)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return mapRowToCategory(row as CategoryRow);
  }
}

function mapRowToCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    userId: row.user_id,
    legacyId: row.legacy_id,
    name: row.name,
    type: row.type,
    icon: normalizeCategoryIcon(row.icon ?? undefined),
    color: normalizeCategoryColor(row.color ?? undefined, row.type),
    active: row.active,
    archivedAt: row.archived_at ? new Date(row.archived_at) : null,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export const categoryRepository = new SupabaseCategoryRepository();
