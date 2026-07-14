import assert from "node:assert/strict";
import test from "node:test";

import type { Entry } from "../domain/entry/entry";
import type { ImportAttachment } from "../domain/import/import-attachment";
import type {
  ImportRequest,
  PreparedImportRow,
} from "../domain/import/import";
import { ApplicationContext } from "../server/context/application-context";
import type { CategoryRepository } from "../server/repositories/category-repository";
import type { EntryAttachmentRepository } from "../server/repositories/entry-attachment-repository";
import type { EntryRepository } from "../server/repositories/entry-repository";
import type { ImportAttachmentRepository } from "../server/repositories/import-attachment-repository";
import type { ImportRepository } from "../server/repositories/import-repository";
import type { WalletRepository } from "../server/repositories/wallet-repository";
import { ImportService } from "../server/services/import-service";
import type { UnitOfWork } from "../server/unit-of-work/unit-of-work";
import { PrepareImportRowsUseCase } from "../server/usecases/import/prepare-import-rows.usecase";

const now = new Date("2026-07-12T12:00:00.000Z");

test("criacao preenche categoria natureza e evento sugeridos pelo historico", async () => {
  const insertedRows: PreparedImportRow[] = [];
  const historyQueries: Array<{
    readonly direction: string;
    readonly walletId: string | null;
    readonly limit: number;
  }> = [];
  const entryRepository = {
    async listSuggestionHistory(
      _context: ApplicationContext,
      query: {
        readonly direction: string;
        readonly walletId: string | null;
        readonly limit: number;
      },
    ) {
      historyQueries.push(query);
      return [
        {
          categoryId: "category-history",
          nature: "OPERATIONAL" as const,
          economicEvent: "CONSUMPTION" as const,
          description: "Subzero",
        },
      ];
    },
  } as unknown as EntryRepository;
  const request = makeRequest({ rows: [] });
  const service = createServiceForImportCreation({
    entryRepository,
    request,
    onInsertRows(rows) {
      insertedRows.push(...rows);
    },
  });

  await service.create(makeContext(), {
    fileName: "fatura.csv",
    fileContent: "date,title,amount\n2026-07-12,Subzero,10.00",
    fileSizeBytes: 48,
    source: "NUBANK_CSV",
    defaultWalletId: "wallet-history",
    defaultCategoryId: null,
    nature: null,
    economicEvent: null,
  });

  assert.deepEqual(historyQueries, [
    { direction: "OUT", walletId: "wallet-history", limit: 1000 },
  ]);
  assert.deepEqual(
    insertedRows.map(({ categoryId, nature, economicEvent }) => ({
      categoryId,
      nature,
      economicEvent,
    })),
    [
      {
        categoryId: "category-history",
        nature: "OPERATIONAL",
        economicEvent: "CONSUMPTION",
      },
    ],
  );
});

test("criacao preserva default de categoria e sugere somente campos sem default", async () => {
  const insertedRows: PreparedImportRow[] = [];
  const entryRepository = {
    async listSuggestionHistory() {
      return [
        {
          categoryId: "category-history",
          nature: "OPERATIONAL" as const,
          economicEvent: "CONSUMPTION" as const,
          description: "Subzero",
        },
      ];
    },
  } as unknown as EntryRepository;
  const request = makeRequest({ rows: [] });
  const service = createServiceForImportCreation({
    entryRepository,
    request,
    onInsertRows(rows) {
      insertedRows.push(...rows);
    },
  });

  await service.create(makeContext(), {
    fileName: "fatura.csv",
    fileContent: "date,title,amount\n2026-07-12,Subzero,10.00",
    fileSizeBytes: 48,
    source: "NUBANK_CSV",
    defaultWalletId: null,
    defaultCategoryId: "category-default",
    nature: null,
    economicEvent: null,
  });

  assert.equal(insertedRows[0]?.categoryId, null);
  assert.equal(insertedRows[0]?.nature, "OPERATIONAL");
  assert.equal(insertedRows[0]?.economicEvent, "CONSUMPTION");
});

test("criacao preserva todos os defaults sem consultar o historico", async () => {
  const insertedRows: PreparedImportRow[] = [];
  let historyQueried = false;
  const entryRepository = {
    async listSuggestionHistory() {
      historyQueried = true;
      return [];
    },
  } as unknown as EntryRepository;
  const service = createServiceForImportCreation({
    entryRepository,
    request: makeRequest({ rows: [] }),
    onInsertRows(rows) {
      insertedRows.push(...rows);
    },
  });

  await service.create(makeContext(), {
    fileName: "fatura.csv",
    fileContent: "date,title,amount\n2026-07-12,Subzero,10.00",
    fileSizeBytes: 48,
    source: "NUBANK_CSV",
    defaultWalletId: null,
    defaultCategoryId: "category-default",
    nature: "PATRIMONIAL",
    economicEvent: "INVESTMENT",
  });

  assert.equal(historyQueried, false);
  assert.deepEqual(
    insertedRows.map(({ categoryId, nature, economicEvent }) => ({
      categoryId,
      nature,
      economicEvent,
    })),
    [{ categoryId: null, nature: null, economicEvent: null }],
  );
});

test("criacao mantem campos vazios quando o historico nao atinge o score minimo", async () => {
  const insertedRows: PreparedImportRow[] = [];
  const entryRepository = {
    async listSuggestionHistory() {
      return [
        {
          categoryId: "category-history",
          nature: "OPERATIONAL" as const,
          economicEvent: "CONSUMPTION" as const,
          description: "Posto de gasolina",
        },
      ];
    },
  } as unknown as EntryRepository;
  const service = createServiceForImportCreation({
    entryRepository,
    request: makeRequest({ rows: [] }),
    onInsertRows(rows) {
      insertedRows.push(...rows);
    },
  });

  await service.create(makeContext(), {
    fileName: "fatura.csv",
    fileContent: "date,title,amount\n2026-07-12,Padaria,10.00",
    fileSizeBytes: 47,
    source: "NUBANK_CSV",
    defaultWalletId: null,
    defaultCategoryId: null,
    nature: null,
    economicEvent: null,
  });

  assert.deepEqual(
    insertedRows.map(({ categoryId, nature, economicEvent }) => ({
      categoryId,
      nature,
      economicEvent,
    })),
    [{ categoryId: null, nature: null, economicEvent: null }],
  );
});

test("confirmacao vincula anexo global a cada entry e anexo de linha somente ao seu entry", async () => {
  const entryAttachments: Array<Parameters<EntryAttachmentRepository["create"]>[1]> = [];
  let entrySequence = 0;
  const request = makeRequest();

  const service = new ImportService({
    repository: {
      async findById() { return request; },
      async setRowEntryId() {},
      async confirmRequest() {},
    } as unknown as ImportRepository,
    entryRepository: {
      async existsByExternalIdAndWallet() { return false; },
      async create(
        _context: ApplicationContext,
        data: Parameters<EntryRepository["create"]>[1],
      ) {
        entrySequence += 1;
        return makeEntry(`entry-${entrySequence}`, data);
      },
    } as unknown as EntryRepository,
    importAttachmentRepository: {
      async listByImportRequestId(
        _context: ApplicationContext,
        _importRequestId: string,
        options: { readonly importRowId: string | null },
      ) {
        return [
          makeAttachment("global", null),
          makeAttachment("row-1-file", "row-1"),
        ].filter((attachment) => attachment.importRowId === options.importRowId);
      },
    } as unknown as ImportAttachmentRepository,
    entryAttachmentRepository: {
      async create(
        _context: ApplicationContext,
        data: Parameters<EntryAttachmentRepository["create"]>[1],
      ) {
        entryAttachments.push(data);
        return { ...data, id: `link-${entryAttachments.length}`, userId: "user-1", createdAt: now, updatedAt: now };
      },
    } as unknown as EntryAttachmentRepository,
    walletRepository: {
      async findById() {
        return { id: "wallet-1", userId: "user-1", name: "Cartao", type: "CREDIT_CARD", initialBalanceCents: 0, active: true, archivedAt: null, createdAt: now, updatedAt: now };
      },
    } as unknown as WalletRepository,
    categoryRepository: {
      async findById() {
        return { id: "category-1", userId: "user-1", name: "Compras", type: "EXPENSE", icon: "tag", color: "#000000", active: true, archivedAt: null, createdAt: now, updatedAt: now };
      },
    } as unknown as CategoryRepository,
    prepareImportRowsUseCase: new PrepareImportRowsUseCase(
      {} as EntryRepository,
    ),
    unitOfWork: {
      async execute(context, work) { return work(context.withTransaction({ client: "tx" })); },
    } as UnitOfWork,
  });

  const result = await service.confirm(makeContext(), { id: "import-1" });

  assert.deepEqual(result, {
    importedCount: 2,
    skippedCount: 0,
    startDate: "2026-07-10",
    endDate: "2026-07-12",
  });
  assert.deepEqual(
    entryAttachments.map(({ entryId, objectPath }) => ({ entryId, objectPath })),
    [
      { entryId: "entry-1", objectPath: "imports/global.pdf" },
      { entryId: "entry-1", objectPath: "imports/row-1-file.pdf" },
      { entryId: "entry-2", objectPath: "imports/global.pdf" },
    ],
  );
});

test("remocao em lote permite importacoes confirmadas sem tocar nos lancamentos", async () => {
  let deletedIds: readonly string[] = [];
  const service = new ImportService({
    repository: {
      async deleteMany(_context: ApplicationContext, ids: readonly string[]) {
        deletedIds = ids;
      },
    } as unknown as ImportRepository,
    entryRepository: {} as EntryRepository,
    importAttachmentRepository: {} as ImportAttachmentRepository,
    entryAttachmentRepository: {} as EntryAttachmentRepository,
    walletRepository: {} as WalletRepository,
    categoryRepository: {} as CategoryRepository,
    prepareImportRowsUseCase: new PrepareImportRowsUseCase({} as EntryRepository),
    unitOfWork: {
      async execute(context, work) { return work(context.withTransaction({ client: "tx" })); },
    } as UnitOfWork,
  });

  await service.deleteMany(makeContext(), { ids: ["pending-import", "confirmed-import"] });

  assert.deepEqual(deletedIds, ["pending-import", "confirmed-import"]);
});

test("edicao em lote atualiza todas as linhas selecionadas em uma unica operacao transacional", async () => {
  const request = makeRequest();
  let updateCalls = 0;
  let receivedIds: readonly string[] = [];
  let receivedPatch: unknown = null;
  const service = new ImportService({
    repository: {
      async findById() { return request; },
      async updateRows(
        _context: ApplicationContext,
        rowIds: readonly string[],
        patch: unknown,
      ) {
        updateCalls += 1;
        receivedIds = rowIds;
        receivedPatch = patch;
        return request.rows;
      },
    } as unknown as ImportRepository,
    entryRepository: {} as EntryRepository,
    importAttachmentRepository: {} as ImportAttachmentRepository,
    entryAttachmentRepository: {} as EntryAttachmentRepository,
    walletRepository: {} as WalletRepository,
    categoryRepository: {
      async findById() {
        return {
          id: "category-2", userId: "user-1", name: "Moradia",
          type: "EXPENSE", icon: "home", color: "#000000", active: true,
          archivedAt: null, createdAt: now, updatedAt: now,
        };
      },
    } as unknown as CategoryRepository,
    prepareImportRowsUseCase: new PrepareImportRowsUseCase({} as EntryRepository),
    unitOfWork: {
      async execute(context, work) {
        return work(context.withTransaction({ client: "tx" }));
      },
    } as UnitOfWork,
  });

  await service.bulkUpdateRows(makeContext(), {
    importRequestId: "import-1",
    rowIds: ["row-1", "row-2"],
    patch: { categoryId: "category-2" },
  });

  assert.equal(updateCalls, 1);
  assert.deepEqual(receivedIds, ["row-1", "row-2"]);
  assert.deepEqual(receivedPatch, { categoryId: "category-2" });
});

function makeContext() {
  return ApplicationContext.user({ principalId: "user-1", now });
}

function createServiceForImportCreation({
  entryRepository,
  request,
  onInsertRows,
}: {
  readonly entryRepository: EntryRepository;
  readonly request: ImportRequest;
  readonly onInsertRows: (rows: readonly PreparedImportRow[]) => void;
}): ImportService {
  return new ImportService({
    repository: {
      async createRequest() { return request; },
      async insertRows(
        _context: ApplicationContext,
        _requestId: string,
        rows: readonly PreparedImportRow[],
      ) { onInsertRows(rows); },
      async findById() { return request; },
    } as unknown as ImportRepository,
    entryRepository,
    prepareImportRowsUseCase: new PrepareImportRowsUseCase(entryRepository),
    importAttachmentRepository: {} as ImportAttachmentRepository,
    entryAttachmentRepository: {} as EntryAttachmentRepository,
    walletRepository: {
      async findById() {
        return {
          id: "wallet-history", userId: "user-1", name: "Cartao",
          type: "CREDIT_CARD", initialBalanceCents: 0, active: true,
          archivedAt: null, createdAt: now, updatedAt: now,
        };
      },
    } as unknown as WalletRepository,
    categoryRepository: {
      async findById() {
        return {
          id: "category-default", userId: "user-1", name: "Default",
          type: "EXPENSE", icon: "tag", color: "#000000", active: true,
          archivedAt: null, createdAt: now, updatedAt: now,
        };
      },
    } as unknown as CategoryRepository,
    unitOfWork: {
      async execute(context, work) {
        return work(context.withTransaction({ client: "tx" }));
      },
    } as UnitOfWork,
  });
}

function makeRequest(patch: Partial<ImportRequest> = {}): ImportRequest {
  const baseRow = {
    importRequestId: "import-1", userId: "user-1", occurredOn: "2026-07-12", amountCents: 1000,
    direction: "OUT" as const, nature: "OPERATIONAL" as const, walletId: "wallet-1", walletName: "Cartao",
    categoryId: "category-1", categoryName: "Compras", categoryColor: "#000000", categoryIcon: "tag",
    externalId: null, valid: true, validationErrors: null, economicEvent: "CONSUMPTION" as const,
    entryId: null, ignoredAt: null, attachmentCount: 0, createdAt: now, updatedAt: now,
  };
  return {
    id: "import-1", userId: "user-1", source: "NUBANK_CSV", status: "PENDING_REVIEW", fileName: "fatura.csv",
    nature: "OPERATIONAL", economicEvent: "CONSUMPTION", confirmedAt: null, defaultWalletId: "wallet-1",
    defaultWalletName: "Cartao", defaultCategoryId: "category-1", defaultCategoryName: "Compras", attachmentCount: 1,
    createdAt: now, updatedAt: now,
    rows: [
      { ...baseRow, id: "row-1", rowNumber: 1, description: "Item 1", attachmentCount: 1 },
      {
        ...baseRow,
        id: "row-2",
        rowNumber: 2,
        occurredOn: "2026-07-10",
        description: "Item 2",
      },
    ],
    ...patch,
  };
}

function makeAttachment(id: string, importRowId: string | null): ImportAttachment {
  return { id, userId: "user-1", importRequestId: "import-1", importRowId, bucketName: "receipts", objectPath: `imports/${id}.pdf`, originalFileName: `${id}.pdf`, mimeType: "application/pdf", sizeBytes: 10, createdAt: now, updatedAt: now };
}

function makeEntry(id: string, data: Parameters<EntryRepository["create"]>[1]): Entry {
  return { ...data, id, userId: "user-1", categoryId: data.categoryId, transferId: null, economicEventId: null, externalId: data.externalId ?? null, receiptPath: null, deletedAt: null, createdAt: now, updatedAt: now, walletName: "Cartao", categoryName: "Compras", categoryColor: "#000000", categoryIcon: "tag" };
}
