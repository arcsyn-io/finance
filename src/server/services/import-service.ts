import { CategoryNotFoundError } from "../../domain/category/category-errors";
import type { EconomicEvent } from "../../domain/entry/entry";
import { InvalidImportError, ImportNotFoundError } from "../../domain/import/import-errors";
import { parseImportCsv } from "../../domain/import/import-csv-parser";
import { WalletNotFoundError } from "../../domain/wallet/wallet-errors";
import type {
  BulkUpdateImportRowsCommand,
  ConfirmImportCommand,
  CreateImportCommand,
  DeleteImportRowCommand,
  DeleteImportsCommand,
  ListImportsCommand,
  SetImportRowIgnoredCommand,
  UpdateImportRowCommand,
} from "../commands/import-commands";
import type { ApplicationContext } from "../context/application-context";
import type { CategoryRepository } from "../repositories/category-repository";
import type { EntryRepository } from "../repositories/entry-repository";
import type { EntryAttachmentRepository } from "../repositories/entry-attachment-repository";
import type { ImportAttachmentRepository } from "../repositories/import-attachment-repository";
import type { ImportRepository } from "../repositories/import-repository";
import type { WalletRepository } from "../repositories/wallet-repository";
import type { UnitOfWork } from "../unit-of-work/unit-of-work";
import { inferDirection, inferEconomicEvent } from "../usecases/entry/entry-validation";
import type { PrepareImportRowsUseCase } from "../usecases/import/prepare-import-rows.usecase";

export type ConfirmImportResult = {
  readonly importedCount: number;
  readonly skippedCount: number;
  readonly startDate: string | null;
  readonly endDate: string | null;
};

export type ImportServiceDependencies = {
  readonly repository: ImportRepository;
  readonly entryRepository: EntryRepository;
  readonly importAttachmentRepository: ImportAttachmentRepository;
  readonly entryAttachmentRepository: EntryAttachmentRepository;
  readonly walletRepository: WalletRepository;
  readonly categoryRepository: CategoryRepository;
  readonly prepareImportRowsUseCase: PrepareImportRowsUseCase;
  readonly unitOfWork: UnitOfWork;
};

export class ImportService {
  constructor(private readonly dependencies: ImportServiceDependencies) {}

  async list(context: ApplicationContext, command: ListImportsCommand) {
    return this.dependencies.repository.list(context, command);
  }

  async listSummaries(context: ApplicationContext, command: ListImportsCommand) {
    return this.dependencies.repository.listSummaries(context, command);
  }

  async findById(context: ApplicationContext, id: string) {
    const request = await this.dependencies.repository.findById(context, id);
    if (!request) throw new ImportNotFoundError();
    return request;
  }

  async create(context: ApplicationContext, command: CreateImportCommand) {
    return this.dependencies.unitOfWork.execute(context, async (txContext) => {
      await this.validateDefaults(txContext, command.defaultWalletId, command.defaultCategoryId);
      const rows = parseImportCsv({
        fileName: command.fileName,
        content: command.fileContent,
        source: command.source,
        sizeBytes: command.fileSizeBytes,
      });
      const preparedRows = await this.dependencies.prepareImportRowsUseCase.execute(
        txContext,
        {
          rows,
          defaultWalletId: command.defaultWalletId,
          defaultCategoryId: command.defaultCategoryId,
          nature: command.nature,
          economicEvent: command.economicEvent,
        },
      );
      const request = await this.dependencies.repository.createRequest(txContext, command);
      await this.dependencies.repository.insertRows(
        txContext,
        request.id,
        preparedRows,
      );
      return this.findById(txContext, request.id);
    });
  }

  async updateRow(context: ApplicationContext, command: UpdateImportRowCommand) {
    return this.dependencies.unitOfWork.execute(context, async (txContext) => {
      const request = await this.findEditable(txContext, command.importRequestId);
      const row = request.rows.find((item) => item.id === command.rowId);
      if (!row) throw new InvalidImportError("Linha nao pertence a esta importacao");
      await this.validateDefaults(txContext, command.walletId, command.categoryId);

      const errors = validateRowFields(command);
      return this.dependencies.repository.updateRow(txContext, command.rowId, {
        description: command.description.trim(),
        occurredOn: command.occurredOn,
        amountCents: command.amountCents,
        walletId: command.walletId,
        categoryId: command.categoryId,
        nature: command.nature,
        economicEvent: command.economicEvent,
        valid: errors.length === 0,
        validationErrors: errors.length > 0 ? errors.join("; ") : null,
      });
    });
  }

  async bulkUpdateRows(
    context: ApplicationContext,
    command: BulkUpdateImportRowsCommand,
  ) {
    return this.dependencies.unitOfWork.execute(context, async (txContext) => {
      const request = await this.findEditable(txContext, command.importRequestId);
      const selectedRows = request.rows.filter((row) => command.rowIds.includes(row.id));

      if (selectedRows.length !== command.rowIds.length) {
        throw new InvalidImportError("Uma ou mais linhas nao pertencem a esta importacao");
      }

      await this.validateDefaults(
        txContext,
        command.patch.walletId ?? null,
        command.patch.categoryId ?? null,
      );

      return this.dependencies.repository.updateRows(
        txContext,
        command.rowIds,
        command.patch,
      );
    });
  }

  async setRowIgnored(
    context: ApplicationContext,
    command: SetImportRowIgnoredCommand,
  ) {
    return this.dependencies.unitOfWork.execute(context, async (txContext) => {
      const request = await this.findEditable(txContext, command.importRequestId);
      if (!request.rows.some((row) => row.id === command.rowId)) {
        throw new InvalidImportError("Linha nao pertence a esta importacao");
      }

      return this.dependencies.repository.setRowIgnored(
        txContext,
        command.rowId,
        command.ignored ? txContext.now.toISOString() : null,
      );
    });
  }

  async deleteRow(context: ApplicationContext, command: DeleteImportRowCommand) {
    return this.dependencies.unitOfWork.execute(context, async (txContext) => {
      const request = await this.findEditable(txContext, command.importRequestId);
      if (!request.rows.some((row) => row.id === command.rowId)) {
        throw new InvalidImportError("Linha nao pertence a esta importacao");
      }

      await this.dependencies.repository.deleteRow(txContext, command.rowId);
    });
  }

  async confirm(
    context: ApplicationContext,
    command: ConfirmImportCommand,
  ): Promise<ConfirmImportResult> {
    return this.dependencies.unitOfWork.execute(context, async (txContext) => {
      const request = await this.findEditable(txContext, command.id);
      const activeRows = request.rows.filter((row) => !row.ignoredAt);

      if (activeRows.length === 0) {
        throw new InvalidImportError("Importacao nao possui linhas para confirmar");
      }

      let importedCount = 0;
      let skippedCount = 0;
      let startDate: string | null = null;
      let endDate: string | null = null;
      const globalAttachments =
        await this.dependencies.importAttachmentRepository.listByImportRequestId(
          txContext,
          request.id,
          { importRowId: null },
        );

      for (const row of activeRows) {
        const walletId = row.walletId ?? request.defaultWalletId;
        const categoryId = row.categoryId ?? request.defaultCategoryId;
        const nature = row.nature ?? request.nature;

        if (!walletId) throw new InvalidImportError(`Carteira obrigatoria: ${row.description ?? "linha sem descricao"}`);
        if (!categoryId) throw new InvalidImportError(`Categoria obrigatoria: ${row.description ?? "linha sem descricao"}`);
        if (!nature) throw new InvalidImportError(`Natureza obrigatoria: ${row.description ?? "linha sem descricao"}`);
        if (!row.valid) throw new InvalidImportError(`Linha invalida: ${row.validationErrors ?? row.description ?? row.id}`);

        if (
          row.externalId &&
          (await this.dependencies.entryRepository.existsByExternalIdAndWallet(
            txContext,
            row.externalId,
            walletId,
          ))
        ) {
          skippedCount += 1;
          continue;
        }

        const wallet = await this.dependencies.walletRepository.findById(txContext, walletId);
        if (!wallet) throw new WalletNotFoundError();
        if (!wallet.active) throw new InvalidImportError("Carteira inativa nao pode receber importacoes");

        const category = await this.dependencies.categoryRepository.findById(txContext, categoryId);
        if (!category) throw new CategoryNotFoundError();

        const direction = inferDirection(category);
        const economicEvent =
          row.economicEvent ??
          request.economicEvent ??
          inferEconomicEvent({
            direction,
            nature,
            transferId: null,
            walletType: wallet.type,
          });

        const entry = await this.dependencies.entryRepository.create(txContext, {
          walletId,
          categoryId,
          nature,
          direction,
          economicEvent: economicEvent as EconomicEvent,
          amountCents: row.amountCents,
          occurredOn: row.occurredOn,
          description: row.description,
          externalId: row.externalId,
        });
        const rowAttachments =
          await this.dependencies.importAttachmentRepository.listByImportRequestId(
            txContext,
            request.id,
            { importRowId: row.id },
          );

        for (const attachment of [...globalAttachments, ...rowAttachments]) {
          await this.dependencies.entryAttachmentRepository.create(txContext, {
            entryId: entry.id,
            bucketName: attachment.bucketName,
            objectPath: attachment.objectPath,
            originalFileName: attachment.originalFileName,
            mimeType: attachment.mimeType,
            sizeBytes: attachment.sizeBytes,
          });
        }
        await this.dependencies.repository.setRowEntryId(txContext, row.id, entry.id);
        importedCount += 1;
        startDate = earliestDate(startDate, row.occurredOn);
        endDate = latestDate(endDate, row.occurredOn);
      }

      await this.dependencies.repository.confirmRequest(txContext, request.id);
      return { importedCount, skippedCount, startDate, endDate };
    });
  }

  async cancel(context: ApplicationContext, command: ConfirmImportCommand) {
    return this.dependencies.unitOfWork.execute(context, async (txContext) => {
      await this.findEditable(txContext, command.id);
      await this.dependencies.repository.deleteRequest(txContext, command.id);
    });
  }

  async deleteMany(context: ApplicationContext, command: DeleteImportsCommand) {
    return this.dependencies.unitOfWork.execute(context, async (txContext) => {
      await this.dependencies.repository.deleteMany(txContext, command.ids);
    });
  }

  private async findEditable(context: ApplicationContext, id: string) {
    const request = await this.findById(context, id);
    if (request.status === "CONFIRMED") {
      throw new InvalidImportError("Importacao ja confirmada");
    }
    return request;
  }

  private async validateDefaults(
    context: ApplicationContext,
    walletId: string | null,
    categoryId: string | null,
  ): Promise<void> {
    if (walletId) {
      const wallet = await this.dependencies.walletRepository.findById(context, walletId);
      if (!wallet) throw new WalletNotFoundError();
      if (!wallet.active) throw new InvalidImportError("Carteira inativa nao pode receber importacoes");
    }

    if (categoryId) {
      const category = await this.dependencies.categoryRepository.findById(context, categoryId);
      if (!category) throw new CategoryNotFoundError();
    }
  }
}

function earliestDate(current: string | null, candidate: string): string {
  return current === null || candidate < current ? candidate : current;
}

function latestDate(current: string | null, candidate: string): string {
  return current === null || candidate > current ? candidate : current;
}

function validateRowFields(command: UpdateImportRowCommand): string[] {
  const errors: string[] = [];

  if (!/^\d{4}-\d{2}-\d{2}$/.test(command.occurredOn)) {
    errors.push("Data invalida");
  }

  if (!Number.isInteger(command.amountCents) || command.amountCents <= 0) {
    errors.push("Valor deve ser maior que zero");
  }

  if (!command.description.trim()) {
    errors.push("Descricao obrigatoria");
  }

  return errors;
}
