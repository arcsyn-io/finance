import {
  CreateCategoryCommand,
  SetCategoryActiveCommand,
  UpdateCategoryCommand,
} from "@/server/commands/category-commands";
import {
  CreateCategoryRequest,
  SetCategoryActiveRequest,
  UpdateCategoryRequest,
} from "@/server/schemas/category-schema";

export function createCategoryRequestToCommand(
  request: CreateCategoryRequest,
): CreateCategoryCommand {
  return {
    name: request.name,
    type: request.type,
  };
}

export function updateCategoryRequestToCommand(
  request: UpdateCategoryRequest,
): UpdateCategoryCommand {
  return {
    id: request.id,
    name: request.name,
    type: request.type,
    active: request.active,
  };
}

export function setCategoryActiveRequestToCommand(
  request: SetCategoryActiveRequest,
): SetCategoryActiveCommand {
  return {
    id: request.id,
  };
}
