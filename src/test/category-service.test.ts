import assert from "node:assert/strict";
import test from "node:test";

import { ApplicationContext } from "../server/context/application-context";
import { UnitOfWork } from "../server/unit-of-work/unit-of-work";
import type { Category } from "../domain/category/category";
import {
  CategoryNotFoundError,
  DuplicateCategoryNameError,
  InvalidCategoryError,
} from "../domain/category/category-errors";
import type {
  CategoryRepository,
  CreateCategoryData,
  UpdateCategoryData,
} from "../server/repositories/category-repository";
import { CategoryService } from "../server/services/category-service";

class FakeUnitOfWork implements UnitOfWork {
  async execute<T>(
    context: ApplicationContext,
    work: (context: ApplicationContext) => Promise<T>,
  ): Promise<T> {
    return work(context.withTransaction({ client: "tx" }));
  }
}

class FakeCategoryRepository implements CategoryRepository {
  readonly categories = new Map<string, Category>();
  private nextId = 1;

  async list(
    context: ApplicationContext,
    options: { includeInactive: boolean },
  ): Promise<Category[]> {
    const userId = context.requireUserPrincipal().id;

    return [...this.categories.values()]
      .filter((category) => category.userId === userId)
      .filter((category) => options.includeInactive || category.active)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async listActiveByType(
    context: ApplicationContext,
    type: Category["type"],
  ): Promise<Category[]> {
    return (await this.list(context, { includeInactive: false })).filter(
      (category) => category.type === type,
    );
  }

  async findById(
    context: ApplicationContext,
    id: string,
  ): Promise<Category | null> {
    const userId = context.requireUserPrincipal().id;
    const category = this.categories.get(id);

    return category?.userId === userId ? category : null;
  }

  async findByName(
    context: ApplicationContext,
    name: string,
  ): Promise<Category | null> {
    const userId = context.requireUserPrincipal().id;
    const normalizedName = name.toLowerCase();

    return (
      [...this.categories.values()].find(
        (category) =>
          category.userId === userId &&
          category.name.toLowerCase() === normalizedName,
      ) ?? null
    );
  }

  async create(
    context: ApplicationContext,
    data: CreateCategoryData,
  ): Promise<Category> {
    const userId = context.requireUserPrincipal().id;
    const now = context.now;
    const id = String(this.nextId++);
    const category: Category = {
      id,
      userId,
      name: data.name,
      type: data.type,
      icon: data.icon,
      color: data.color,
      active: data.active,
      archivedAt: data.active ? null : now,
      createdAt: now,
      updatedAt: now,
    };

    this.categories.set(id, category);

    return category;
  }

  async update(
    context: ApplicationContext,
    id: string,
    data: UpdateCategoryData,
  ): Promise<Category> {
    const existing = await this.findById(context, id);

    if (!existing) {
      throw new CategoryNotFoundError();
    }

    const updated: Category = {
      ...existing,
      name: data.name,
      type: data.type,
      icon: data.icon,
      color: data.color,
      active: data.active,
      archivedAt: data.active ? null : context.now,
      updatedAt: context.now,
    };

    this.categories.set(id, updated);

    return updated;
  }

  async setActive(
    context: ApplicationContext,
    id: string,
    active: boolean,
  ): Promise<Category> {
    const existing = await this.findById(context, id);

    if (!existing) {
      throw new CategoryNotFoundError();
    }

    const updated: Category = {
      ...existing,
      active,
      archivedAt: active ? null : context.now,
      updatedAt: context.now,
    };

    this.categories.set(id, updated);

    return updated;
  }
}

function makeService(repository = new FakeCategoryRepository()) {
  return {
    repository,
    service: new CategoryService({
      repository,
      unitOfWork: new FakeUnitOfWork(),
    }),
  };
}

function makeContext(userId = "user-1") {
  return ApplicationContext.user({
    principalId: userId,
    now: new Date("2026-07-08T12:00:00.000Z"),
  });
}

test("cria categoria normalizando nome e ativando por padrao", async () => {
  const { service } = makeService();
  const context = makeContext();

  const category = await service.create(context, {
    name: "  Alimentacao  ",
    type: "EXPENSE",
  });

  assert.equal(category.name, "Alimentacao");
  assert.equal(category.type, "EXPENSE");
  assert.equal(category.icon, "Tag");
  assert.equal(category.color, "oklch(0.66 0.19 24)");
  assert.equal(category.active, true);
  assert.equal(category.userId, "user-1");
});

test("cria e atualiza categoria preservando icone e cor", async () => {
  const { service } = makeService();
  const context = makeContext();

  const category = await service.create(context, {
    name: "Servicos",
    type: "INCOME",
    icon: "Briefcase",
    color: "oklch(0.68 0.07 235)",
  });
  const updated = await service.update(context, {
    id: category.id,
    name: "Servicos premium",
    type: "INCOME",
    icon: "Star",
    color: "oklch(0.72 0.12 290)",
    active: true,
  });

  assert.equal(category.icon, "Briefcase");
  assert.equal(category.color, "oklch(0.68 0.07 235)");
  assert.equal(updated.icon, "Star");
  assert.equal(updated.color, "oklch(0.72 0.12 290)");
});

test("rejeita categoria sem nome ou tipo", async () => {
  const { service } = makeService();
  const context = makeContext();

  await assert.rejects(
    () => service.create(context, { name: " ", type: "EXPENSE" }),
    InvalidCategoryError,
  );

  await assert.rejects(
    () => service.create(context, { name: "Salario", type: undefined }),
    InvalidCategoryError,
  );
});

test("rejeita nome duplicado de forma case-insensitive por usuario", async () => {
  const { service } = makeService();
  const context = makeContext();

  await service.create(context, { name: "Salario", type: "INCOME" });

  await assert.rejects(
    () => service.create(context, { name: "salario", type: "INCOME" }),
    DuplicateCategoryNameError,
  );
});

test("atualiza categoria ignorando duplicidade do proprio registro", async () => {
  const { service } = makeService();
  const context = makeContext();
  const category = await service.create(context, {
    name: "Salario",
    type: "INCOME",
  });

  const updated = await service.update(context, {
    id: category.id,
    name: " Salario ",
    type: "INCOME",
    active: false,
  });

  assert.equal(updated.name, "Salario");
  assert.equal(updated.active, false);
});

test("rejeita update com duplicidade de outro registro", async () => {
  const { service } = makeService();
  const context = makeContext();
  await service.create(context, { name: "Salario", type: "INCOME" });
  const category = await service.create(context, {
    name: "Bonus",
    type: "INCOME",
  });

  await assert.rejects(
    () =>
      service.update(context, {
        id: category.id,
        name: "salario",
        type: "INCOME",
        active: true,
      }),
    DuplicateCategoryNameError,
  );
});

test("lista categorias ativas por padrao e todas quando solicitado", async () => {
  const { service } = makeService();
  const context = makeContext();
  const active = await service.create(context, {
    name: "Alimentacao",
    type: "EXPENSE",
  });
  const inactive = await service.create(context, {
    name: "Salario",
    type: "INCOME",
  });
  await service.deactivate(context, { id: inactive.id });

  assert.deepEqual(
    (await service.list(context, { includeInactive: false })).map(
      (category) => category.id,
    ),
    [active.id],
  );

  assert.deepEqual(
    (await service.list(context, { includeInactive: true })).map(
      (category) => category.name,
    ),
    ["Alimentacao", "Salario"],
  );
});

test("ativa e desativa categoria existente", async () => {
  const { service } = makeService();
  const context = makeContext();
  const category = await service.create(context, {
    name: "Alimentacao",
    type: "EXPENSE",
  });

  const inactive = await service.deactivate(context, { id: category.id });
  const active = await service.activate(context, { id: category.id });

  assert.equal(inactive.active, false);
  assert.equal(active.active, true);
});

test("falha ao ativar categoria inexistente", async () => {
  const { service } = makeService();

  await assert.rejects(
    () => service.activate(makeContext(), { id: "missing" }),
    CategoryNotFoundError,
  );
});
