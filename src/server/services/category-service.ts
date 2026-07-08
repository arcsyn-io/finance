import type { Category } from "../../domain/category/category";
import type {
  CreateCategoryCommand,
  ListActiveCategoriesByTypeCommand,
  ListCategoriesCommand,
  SetCategoryActiveCommand,
  UpdateCategoryCommand,
} from "../commands/category-commands";
import type { ApplicationContext } from "../context/application-context";
import type { CategoryRepository } from "../repositories/category-repository";
import type { UnitOfWork } from "../unit-of-work/unit-of-work";
import { CreateCategoryUseCase } from "../usecases/category/create-category.usecase";
import { FindCategoryByIdUseCase } from "../usecases/category/find-category-by-id.usecase";
import { ListActiveCategoriesByTypeUseCase } from "../usecases/category/list-active-categories-by-type.usecase";
import { ListCategoriesUseCase } from "../usecases/category/list-categories.usecase";
import { SetCategoryActiveUseCase } from "../usecases/category/set-category-active.usecase";
import { UpdateCategoryUseCase } from "../usecases/category/update-category.usecase";

export type CategoryServiceDependencies = {
  readonly repository: CategoryRepository;
  readonly unitOfWork: UnitOfWork;
};

export class CategoryService {
  private readonly listCategoriesUseCase: ListCategoriesUseCase;
  private readonly listActiveCategoriesByTypeUseCase: ListActiveCategoriesByTypeUseCase;
  private readonly findCategoryByIdUseCase: FindCategoryByIdUseCase;
  private readonly createCategoryUseCase: CreateCategoryUseCase;
  private readonly updateCategoryUseCase: UpdateCategoryUseCase;
  private readonly setCategoryActiveUseCase: SetCategoryActiveUseCase;

  constructor(private readonly dependencies: CategoryServiceDependencies) {
    this.listCategoriesUseCase = new ListCategoriesUseCase(
      dependencies.repository,
    );
    this.listActiveCategoriesByTypeUseCase =
      new ListActiveCategoriesByTypeUseCase(dependencies.repository);
    this.findCategoryByIdUseCase = new FindCategoryByIdUseCase(
      dependencies.repository,
    );
    this.createCategoryUseCase = new CreateCategoryUseCase(
      dependencies.repository,
    );
    this.updateCategoryUseCase = new UpdateCategoryUseCase(
      dependencies.repository,
    );
    this.setCategoryActiveUseCase = new SetCategoryActiveUseCase(
      dependencies.repository,
    );
  }

  async list(
    context: ApplicationContext,
    command: ListCategoriesCommand,
  ): Promise<Category[]> {
    return this.listCategoriesUseCase.execute(context, command);
  }

  async listActiveByType(
    context: ApplicationContext,
    command: ListActiveCategoriesByTypeCommand,
  ): Promise<Category[]> {
    return this.listActiveCategoriesByTypeUseCase.execute(context, {
      type: command.type,
    });
  }

  async findById(
    context: ApplicationContext,
    command: SetCategoryActiveCommand,
  ): Promise<Category> {
    return this.findCategoryByIdUseCase.execute(context, { id: command.id });
  }

  async create(
    context: ApplicationContext,
    command: CreateCategoryCommand,
  ): Promise<Category> {
    return this.dependencies.unitOfWork.execute(context, (transactionContext) =>
      this.createCategoryUseCase.execute(transactionContext, {
        name: command.name,
        type: command.type,
      }),
    );
  }

  async update(
    context: ApplicationContext,
    command: UpdateCategoryCommand,
  ): Promise<Category> {
    return this.dependencies.unitOfWork.execute(context, (transactionContext) =>
      this.updateCategoryUseCase.execute(transactionContext, {
        id: command.id,
        name: command.name,
        type: command.type,
        active: command.active,
      }),
    );
  }

  async activate(
    context: ApplicationContext,
    command: SetCategoryActiveCommand,
  ): Promise<Category> {
    return this.dependencies.unitOfWork.execute(context, (transactionContext) =>
      this.setCategoryActiveUseCase.execute(transactionContext, {
        id: command.id,
        active: true,
      }),
    );
  }

  async deactivate(
    context: ApplicationContext,
    command: SetCategoryActiveCommand,
  ): Promise<Category> {
    return this.dependencies.unitOfWork.execute(context, (transactionContext) =>
      this.setCategoryActiveUseCase.execute(transactionContext, {
        id: command.id,
        active: false,
      }),
    );
  }
}
