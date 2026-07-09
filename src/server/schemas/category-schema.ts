import { z } from "zod";
import { categoryTypes } from "../../domain/category/category";

export const categoryTypeSchema = z.enum(categoryTypes, {
  errorMap: () => ({ message: "Tipo da categoria e obrigatorio" }),
});

export const createCategoryRequestSchema = z.object({
  name: z.string(),
  type: categoryTypeSchema.optional(),
});

export const updateCategoryRequestSchema = z.object({
  id: z.string().uuid("Categoria nao encontrada"),
  name: z.string(),
  type: categoryTypeSchema.optional(),
  active: z.boolean(),
});

export const setCategoryActiveRequestSchema = z.object({
  id: z.string().uuid("Categoria nao encontrada"),
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
