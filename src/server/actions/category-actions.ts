"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  CategoryNotFoundError,
  DuplicateCategoryNameError,
  InvalidCategoryError,
} from "@/domain/category/category-errors";
import { getCurrentApplicationContext } from "@/server/context/current-application-context";
import {
  createCategoryRequestToCommand,
  setCategoryActiveRequestToCommand,
  updateCategoryRequestToCommand,
} from "@/server/mappers/category-mapper";
import {
  createCategoryRequestSchema,
  setCategoryActiveRequestSchema,
  updateCategoryRequestSchema,
} from "@/server/schemas/category-schema";
import { createCategoryService } from "@/server/services/category-service-factory";

const categoryService = createCategoryService();

export async function createCategory(formData: FormData): Promise<void> {
  const context = await getCurrentApplicationContext();
  const result = createCategoryRequestSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    type: emptyToUndefined(formData.get("type")),
  });

  if (!result.success) {
    redirectWithError(result.error.issues[0]?.message);
  }

  try {
    await categoryService.create(
      context,
      createCategoryRequestToCommand(result.data),
    );
  } catch (error) {
    redirectWithError(getCategoryErrorMessage(error));
  }

  revalidatePath("/categories");
  redirect("/categories?status=created");
}

export async function updateCategory(formData: FormData): Promise<void> {
  const context = await getCurrentApplicationContext();
  const result = updateCategoryRequestSchema.safeParse({
    id: String(formData.get("id") ?? ""),
    name: String(formData.get("name") ?? ""),
    type: emptyToUndefined(formData.get("type")),
    active: formData.get("active") === "on",
  });

  if (!result.success) {
    redirectWithError(result.error.issues[0]?.message);
  }

  try {
    await categoryService.update(
      context,
      updateCategoryRequestToCommand(result.data),
    );
  } catch (error) {
    redirectWithError(getCategoryErrorMessage(error));
  }

  revalidatePath("/categories");
  redirect("/categories?status=updated");
}

export async function activateCategory(formData: FormData): Promise<void> {
  await setCategoryActive(formData, true);
}

export async function deactivateCategory(formData: FormData): Promise<void> {
  await setCategoryActive(formData, false);
}

async function setCategoryActive(
  formData: FormData,
  active: boolean,
): Promise<void> {
  const context = await getCurrentApplicationContext();
  const result = setCategoryActiveRequestSchema.safeParse({
    id: String(formData.get("id") ?? ""),
  });

  if (!result.success) {
    redirectWithError(result.error.issues[0]?.message);
  }

  try {
    const command = setCategoryActiveRequestToCommand(result.data);

    if (active) {
      await categoryService.activate(context, command);
    } else {
      await categoryService.deactivate(context, command);
    }
  } catch (error) {
    redirectWithError(getCategoryErrorMessage(error));
  }

  revalidatePath("/categories");
  redirect(active ? "/categories?status=activated" : "/categories?status=deactivated");
}

function emptyToUndefined(value: FormDataEntryValue | null): string | undefined {
  if (typeof value !== "string" || value === "") {
    return undefined;
  }

  return value;
}

function getCategoryErrorMessage(error: unknown): string {
  if (
    error instanceof InvalidCategoryError ||
    error instanceof DuplicateCategoryNameError ||
    error instanceof CategoryNotFoundError
  ) {
    return error.message;
  }

  return "Nao foi possivel salvar a categoria";
}

function redirectWithError(message = "Nao foi possivel salvar a categoria"): never {
  redirect(`/categories?error=${encodeURIComponent(message)}`);
}
