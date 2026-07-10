import type { Wallet } from "../../domain/wallet/wallet";
import type {
  CreateWalletCommand,
  ListWalletsCommand,
  SetWalletActiveCommand,
  UpdateWalletCommand,
} from "../commands/wallet-commands";
import type { ApplicationContext } from "../context/application-context";
import type { WalletRepository } from "../repositories/wallet-repository";
import type { UnitOfWork } from "../unit-of-work/unit-of-work";
import { CreateWalletUseCase } from "../usecases/wallet/create-wallet.usecase";
import { FindWalletByIdUseCase } from "../usecases/wallet/find-wallet-by-id.usecase";
import { ListWalletsUseCase } from "../usecases/wallet/list-wallets.usecase";
import { SetWalletActiveUseCase } from "../usecases/wallet/set-wallet-active.usecase";
import { UpdateWalletUseCase } from "../usecases/wallet/update-wallet.usecase";

export type WalletServiceDependencies = {
  readonly repository: WalletRepository;
  readonly unitOfWork: UnitOfWork;
};

export class WalletService {
  private readonly listWalletsUseCase: ListWalletsUseCase;
  private readonly findWalletByIdUseCase: FindWalletByIdUseCase;
  private readonly createWalletUseCase: CreateWalletUseCase;
  private readonly updateWalletUseCase: UpdateWalletUseCase;
  private readonly setWalletActiveUseCase: SetWalletActiveUseCase;

  constructor(private readonly dependencies: WalletServiceDependencies) {
    this.listWalletsUseCase = new ListWalletsUseCase(dependencies.repository);
    this.findWalletByIdUseCase = new FindWalletByIdUseCase(
      dependencies.repository,
    );
    this.createWalletUseCase = new CreateWalletUseCase(
      dependencies.repository,
    );
    this.updateWalletUseCase = new UpdateWalletUseCase(
      dependencies.repository,
    );
    this.setWalletActiveUseCase = new SetWalletActiveUseCase(
      dependencies.repository,
    );
  }

  async list(
    context: ApplicationContext,
    command: ListWalletsCommand,
  ): Promise<Wallet[]> {
    return this.listWalletsUseCase.execute(context, command);
  }

  async findById(
    context: ApplicationContext,
    command: SetWalletActiveCommand,
  ): Promise<Wallet> {
    return this.findWalletByIdUseCase.execute(context, { id: command.id });
  }

  async create(
    context: ApplicationContext,
    command: CreateWalletCommand,
  ): Promise<Wallet> {
    return this.dependencies.unitOfWork.execute(context, (transactionContext) =>
      this.createWalletUseCase.execute(transactionContext, command),
    );
  }

  async update(
    context: ApplicationContext,
    command: UpdateWalletCommand,
  ): Promise<Wallet> {
    return this.dependencies.unitOfWork.execute(context, (transactionContext) =>
      this.updateWalletUseCase.execute(transactionContext, command),
    );
  }

  async activate(
    context: ApplicationContext,
    command: SetWalletActiveCommand,
  ): Promise<Wallet> {
    return this.dependencies.unitOfWork.execute(context, (transactionContext) =>
      this.setWalletActiveUseCase.execute(transactionContext, {
        id: command.id,
        active: true,
      }),
    );
  }

  async deactivate(
    context: ApplicationContext,
    command: SetWalletActiveCommand,
  ): Promise<Wallet> {
    return this.dependencies.unitOfWork.execute(context, (transactionContext) =>
      this.setWalletActiveUseCase.execute(transactionContext, {
        id: command.id,
        active: false,
      }),
    );
  }
}
