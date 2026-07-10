import {
  CategoryNotFoundError,
  DuplicateCategoryNameError,
  InvalidCategoryError,
} from "../../domain/category/category-errors";
import type { CategoryService } from "../services/category-service";
import type { Category } from "../../domain/category/category";
import type { ApplicationContext } from "../context/application-context";
import {
  createCategoryRequestToCommand,
  setCategoryActiveRequestToCommand,
  updateCategoryRequestToCommand,
} from "../mappers/category-mapper";
import {
  createCategoryRequestSchema,
  setCategoryActiveRequestSchema,
  updateCategoryRequestSchema,
} from "../schemas/category-schema";
import type { HttpJsonResponse } from "../responses/http-json-response";

type CategoryControllerDependencies = {
  readonly context: ApplicationContext;
  readonly service: Pick<
    CategoryService,
    "create" | "update" | "activate" | "deactivate"
  >;
};

type CategoryMutationResponse = HttpJsonResponse<{
  readonly status?: "created" | "updated" | "activated" | "deactivated";
  readonly category?: Category;
  readonly error?: string;
}>;

export async function createCategoryJson({
  context,
  service,
  body,
}: CategoryControllerDependencies & {
  readonly body: unknown;
}): Promise<CategoryMutationResponse> {
  const result = createCategoryRequestSchema.safeParse(body);

  if (!result.success) {
    return validationError(result.error.issues[0]?.message);
  }

  try {
    const category = await service.create(
      context,
      createCategoryRequestToCommand(result.data),
    );
    return { status: 201, body: { status: "created", category } };
  } catch (error) {
    return categoryError(error);
  }
}

export async function updateCategoryJson({
  context,
  service,
  id,
  body,
}: CategoryControllerDependencies & {
  readonly id: string;
  readonly body: unknown;
}): Promise<CategoryMutationResponse> {
  const request =
    typeof body === "object" && body !== null ? { ...body, id } : { id };
  const result = updateCategoryRequestSchema.safeParse(request);

  if (!result.success) {
    return validationError(result.error.issues[0]?.message);
  }

  try {
    const category = await service.update(
      context,
      updateCategoryRequestToCommand(result.data),
    );
    return { status: 200, body: { status: "updated", category } };
  } catch (error) {
    return categoryError(error);
  }
}

export async function setCategoryActiveJson({
  context,
  service,
  id,
  body,
}: CategoryControllerDependencies & {
  readonly id: string;
  readonly body: unknown;
}): Promise<CategoryMutationResponse> {
  const active = parseActive(body);

  if (typeof active !== "boolean") {
    return validationError("Status da categoria e obrigatorio");
  }

  const result = setCategoryActiveRequestSchema.safeParse({ id });

  if (!result.success) {
    return validationError(result.error.issues[0]?.message);
  }

  try {
    const command = setCategoryActiveRequestToCommand(result.data);

    if (active) {
      const category = await service.activate(context, command);
      return { status: 200, body: { status: "activated", category } };
    }

    const category = await service.deactivate(context, command);
    return { status: 200, body: { status: "deactivated", category } };
  } catch (error) {
    return categoryError(error);
  }
}

function parseActive(body: unknown): boolean | undefined {
  if (typeof body !== "object" || body === null || !("active" in body)) {
    return undefined;
  }

  const active = body.active;

  return typeof active === "boolean" ? active : undefined;
}

function validationError(message = "Dados da categoria invalidos") {
  return {
    status: 400,
    body: { error: message },
  } as const;
}

function categoryError(error: unknown): CategoryMutationResponse {
  if (error instanceof CategoryNotFoundError) {
    return {
      status: 404,
      body: { error: error.message },
    };
  }

  if (
    error instanceof InvalidCategoryError ||
    error instanceof DuplicateCategoryNameError
  ) {
    return {
      status: 400,
      body: { error: error.message },
    };
  }

  return {
    status: 500,
    body: { error: "Nao foi possivel salvar a categoria" },
  };
}
