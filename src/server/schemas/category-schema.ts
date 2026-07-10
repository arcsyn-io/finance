import { z } from "zod";
import { categoryTypes } from "../../domain/category/category";

export const categoryTypeSchema = z.enum(categoryTypes, {
  errorMap: () => ({ message: "Tipo da categoria e obrigatorio" }),
});

export const createCategoryRequestSchema = z.object({
  name: z.string(),
  type: categoryTypeSchema.optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  active: z.boolean().optional(),
});

export const updateCategoryRequestSchema = z.object({
  id: z.string().uuid("Categoria nao encontrada"),
  name: z.string(),
  type: categoryTypeSchema.optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  active: z.boolean(),
});

export const setCategoryActiveRequestSchema = z.object({
  id: z.string().uuid("Categoria nao encontrada"),
});

export const listCategoriesRequestSchema = z.object({
  includeInactive: z
    .union([z.literal("true"), z.literal("false"), z.boolean()])
    .optional()
    .transform((value) => value === true || value === "true"),
  limit: z.coerce
    .number()
    .int("Limite invalido")
    .min(1, "Limite invalido")
    .max(50, "Limite invalido")
    .optional()
    .default(10),
  search: z.string().optional().default(""),
  type: categoryTypeSchema.optional(),
});

export type CreateCategoryRequest = z.infer<
  typeof createCategoryRequestSchema
>;

export type UpdateCategoryRequest = z.infer<
  typeof updateCategoryRequestSchema
>;

export type SetCategoryActiveRequest = z.infer<
  typeof setCategoryActiveRequestSchema
>;

export type ListCategoriesRequest = z.infer<typeof listCategoriesRequestSchema>;
