import type { Entry } from "../../domain/entry/entry";
import type {
  CreateEntryCommand,
  DeleteEntryCommand,
  ListEntriesCommand,
  RestoreEntryCommand,
  UpdateEntryCommand,
} from "../commands/entry-commands";
import type { ApplicationContext } from "../context/application-context";
import type { CategoryRepository } from "../repositories/category-repository";
import type { EntryRepository } from "../repositories/entry-repository";
import type { WalletRepository } from "../repositories/wallet-repository";
import type { UnitOfWork } from "../unit-of-work/unit-of-work";
import { CreateEntryUseCase } from "../usecases/entry/create-entry.usecase";
import { DeleteEntryUseCase } from "../usecases/entry/delete-entry.usecase";
import { ListEntriesUseCase } from "../usecases/entry/list-entries.usecase";
import { RestoreEntryUseCase } from "../usecases/entry/restore-entry.usecase";
import { UpdateEntryUseCase } from "../usecases/entry/update-entry.usecase";

export type EntryServiceDependencies = {
  readonly repository: EntryRepository;
  readonly walletRepository: WalletRepository;
  readonly categoryRepository: CategoryRepository;
  readonly unitOfWork: UnitOfWork;
};

export class EntryService {
  private readonly listEntriesUseCase: ListEntriesUseCase;
  private readonly createEntryUseCase: CreateEntryUseCase;
  private readonly updateEntryUseCase: UpdateEntryUseCase;
  private readonly deleteEntryUseCase: DeleteEntryUseCase;
  private readonly restoreEntryUseCase: RestoreEntryUseCase;

  constructor(private readonly dependencies: EntryServiceDependencies) {
    this.listEntriesUseCase = new ListEntriesUseCase(dependencies.repository);
    this.createEntryUseCase = new CreateEntryUseCase(
      dependencies.repository,
      dependencies.walletRepository,
      dependencies.categoryRepository,
    );
    this.updateEntryUseCase = new UpdateEntryUseCase(
      dependencies.repository,
      dependencies.walletRepository,
      dependencies.categoryRepository,
    );
    this.deleteEntryUseCase = new DeleteEntryUseCase(dependencies.repository);
    this.restoreEntryUseCase = new RestoreEntryUseCase(dependencies.repository);
  }

  async list(
    context: ApplicationContext,
    command: ListEntriesCommand,
  ): Promise<Entry[]> {
    return this.listEntriesUseCase.execute(context, command);
  }

  async create(
    context: ApplicationContext,
    command: CreateEntryCommand,
  ): Promise<Entry> {
    return this.dependencies.unitOfWork.execute(context, (transactionContext) =>
      this.createEntryUseCase.execute(transactionContext, command),
    );
  }

  async update(
    context: ApplicationContext,
    command: UpdateEntryCommand,
  ): Promise<Entry> {
    return this.dependencies.unitOfWork.execute(context, (transactionContext) =>
      this.updateEntryUseCase.execute(transactionContext, command),
    );
  }

  async delete(
    context: ApplicationContext,
    command: DeleteEntryCommand,
  ): Promise<Entry> {
    return this.dependencies.unitOfWork.execute(context, (transactionContext) =>
      this.deleteEntryUseCase.execute(transactionContext, command.id),
    );
  }

  async restore(
    context: ApplicationContext,
    command: RestoreEntryCommand,
  ): Promise<Entry> {
    return this.dependencies.unitOfWork.execute(context, (transactionContext) =>
      this.restoreEntryUseCase.execute(transactionContext, command.id),
    );
  }
}
