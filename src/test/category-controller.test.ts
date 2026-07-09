import assert from "node:assert/strict";
import test from "node:test";

import {
  CategoryNotFoundError,
  InvalidCategoryError,
} from "../domain/category/category-errors";
import type { Category } from "../domain/category/category";
import type {
  CreateCategoryCommand,
  SetCategoryActiveCommand,
  UpdateCategoryCommand,
} from "../server/commands/category-commands";
import { ApplicationContext } from "../server/context/application-context";
import {
  createCategoryJson,
  setCategoryActiveJson,
  updateCategoryJson,
} from "../server/controllers/category-controller";

class FakeCategoryService {
  createCommand: CreateCategoryCommand | null = null;
  updateCommand: UpdateCategoryCommand | null = null;
  setActiveCommand: SetCategoryActiveCommand | null = null;

  async create(
    context: ApplicationContext,
    command: CreateCategoryCommand,
  ): Promise<Category> {
    this.createCommand = command;
    return makeCategory(context, {
      id: "category-1",
      name: command.name,
      type: command.type ?? "EXPENSE",
      active: true,
    });
  }

  async update(
    context: ApplicationContext,
    command: UpdateCategoryCommand,
  ): Promise<Category> {
    this.updateCommand = command;

    if (command.id === "00000000-0000-0000-0000-000000000404") {
      throw new CategoryNotFoundError();
    }

    return makeCategory(context, {
      id: command.id,
      name: command.name,
      type: command.type ?? "EXPENSE",
      active: command.active,
    });
  }

  async activate(
    context: ApplicationContext,
    command: SetCategoryActiveCommand,
  ): Promise<Category> {
    this.setActiveCommand = command;
    return makeCategory(context, {
      id: command.id,
      name: "Alimentacao",
      type: "EXPENSE",
      active: true,
    });
  }

  async deactivate(
    context: ApplicationContext,
    command: SetCategoryActiveCommand,
  ): Promise<Category> {
    this.setActiveCommand = command;
    return makeCategory(context, {
      id: command.id,
      name: "Alimentacao",
      type: "EXPENSE",
      active: false,
    });
  }
}

function makeContext() {
  return ApplicationContext.user({
    principalId: "user-1",
    now: new Date("2026-07-08T12:00:00.000Z"),
  });
}

function makeCategory(
  context: ApplicationContext,
  data: Pick<Category, "id" | "name" | "type" | "active">,
): Category {
  return {
    ...data,
    userId: context.requireUserPrincipal().id,
    archivedAt: null,
    createdAt: context.now,
    updatedAt: context.now,
  };
}

test("controller cria categoria a partir de JSON valido", async () => {
  const service = new FakeCategoryService();
  const response = await createCategoryJson({
    context: makeContext(),
    service,
    body: { name: "Alimentacao", type: "EXPENSE" },
  });

  assert.equal(response.status, 201);
  assert.deepEqual(service.createCommand, {
    name: "Alimentacao",
    type: "EXPENSE",
  });
  assert.equal(response.body.status, "created");
});

test("controller retorna 400 para JSON invalido", async () => {
  const response = await createCategoryJson({
    context: makeContext(),
    service: new FakeCategoryService(),
    body: { name: "Alimentacao", type: "INVALID" },
  });

  assert.equal(response.status, 400);
  assert.equal(response.body.error, "Tipo da categoria e obrigatorio");
});

test("controller retorna 404 para categoria inexistente", async () => {
  const response = await updateCategoryJson({
    context: makeContext(),
    service: new FakeCategoryService(),
    id: "00000000-0000-0000-0000-000000000404",
    body: { name: "Alimentacao", type: "EXPENSE", active: true },
  });

  assert.equal(response.status, 404);
  assert.equal(response.body.error, "Categoria nao encontrada");
});

test("controller alterna status de categoria com JSON booleano", async () => {
  const service = new FakeCategoryService();
  const response = await setCategoryActiveJson({
    context: makeContext(),
    service,
    id: "00000000-0000-0000-0000-000000000001",
    body: { active: false },
  });

  assert.equal(response.status, 200);
  assert.deepEqual(service.setActiveCommand, {
    id: "00000000-0000-0000-0000-000000000001",
  });
  assert.equal(response.body.status, "deactivated");
});

test("controller preserva erros de negocio como 400", async () => {
  class InvalidService extends FakeCategoryService {
    override async create(): Promise<Category> {
      throw new InvalidCategoryError("Nome da categoria e obrigatorio");
    }
  }

  const response = await createCategoryJson({
    context: makeContext(),
    service: new InvalidService(),
    body: { name: " ", type: "EXPENSE" },
  });

  assert.equal(response.status, 400);
  assert.equal(response.body.error, "Nome da categoria e obrigatorio");
});
