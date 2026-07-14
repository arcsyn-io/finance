"use client";

import {
  type FocusEvent,
  FormEvent,
  type KeyboardEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  Ban,
  CalendarDays,
  Check,
  CheckSquare,
  ChevronDown,
  ChevronLeft,
  FileText,
  LayoutList,
  Loader2,
  Paperclip,
  Pencil,
  Plus,
  RotateCcw,
  Square,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import type { Category } from "@/domain/category/category";
import type { EconomicEvent, EntryNature } from "@/domain/entry/entry";
import {
  economicEventLabels,
  economicEvents,
  entryNatureLabels,
  entryNatures,
} from "@/domain/entry/entry";
import type {
  ImportRequest,
  ImportRequestSummary,
  ImportRow,
  ImportSource,
} from "@/domain/import/import";
import type { ImportAttachmentWithPreview } from "@/domain/import/import-attachment";
import { importSourceLabels, importStatusLabels } from "@/domain/import/import";
import type { Wallet } from "@/domain/wallet/wallet";
import { SystemToast, type SystemToastMessage } from "@/components/ui/system-toast";
import { CurrencyField } from "@/components/ui/CurrencyField";
import { CalendarField } from "@/components/ui/CalendarField";
import { Dropdown } from "@/components/ui/Dropdown";
import { CategorySelect } from "@/components/domain/CategorySelect";
import {
  getImportRowViewStatus,
  getVisibleImportRowStatus,
  groupImportRowsByStatus,
  importRowStatusLabels,
  orderImportRowsByDate,
  type ImportRowsViewMode,
  type ImportRowViewStatus,
} from "@/modules/imports/view-models/import-row-view";
import { toImportRequestSummaryView } from "@/modules/imports/view-models/import-request-summary-view";

type ImportsWorkspaceProps = {
  readonly initialImports: readonly ImportRequestSummary[];
  readonly initialSelectedImport: ImportRequest | null;
  readonly wallets: readonly Wallet[];
  readonly categories: readonly Category[];
};

type ImportApiResponse = {
  readonly imports?: ImportRequest[];
  readonly importRequest?: ImportRequest;
  readonly row?: ImportRow;
  readonly rows?: ImportRow[];
  readonly deletedRowId?: string;
  readonly deletedImportIds?: readonly string[];
  readonly status?: string;
  readonly result?: {
    importedCount: number;
    skippedCount: number;
    startDate: string | null;
    endDate: string | null;
  };
  readonly error?: string;
};

type ImportAttachmentApiResponse = {
  readonly attachment?: ImportAttachmentWithPreview;
  readonly attachments?: ImportAttachmentWithPreview[];
  readonly error?: string;
};

type ImportAttachmentTarget = {
  readonly importRequestId: string;
  readonly importRowId: string | null;
  readonly title: string;
};

type RowPatch = {
  readonly description: string;
  readonly occurredOn: string;
  readonly amountCents: number;
  readonly walletId: string | null;
  readonly categoryId: string | null;
  readonly nature: EntryNature | null;
  readonly economicEvent: EconomicEvent | null;
};

type MutableRowPatch = {
  -readonly [Key in keyof RowPatch]?: RowPatch[Key];
};

type ImportRowSavingField =
  | "amountCents"
  | "categoryId"
  | "description"
  | "economicEvent"
  | "ignoredAt"
  | "nature"
  | "occurredOn"
  | "walletId";

type ImportRowNavigationField =
  | "amountCents"
  | "categoryId"
  | "description"
  | "economicEvent"
  | "occurredOn"
  | "walletId";

const importRowNavigationFields: readonly ImportRowNavigationField[] = [
  "occurredOn",
  "categoryId",
  "description",
  "walletId",
  "economicEvent",
  "amountCents",
];

type ImportRowOptimisticPatch = Partial<RowPatch> &
  Partial<
    Pick<
      ImportRow,
      "categoryColor" | "categoryIcon" | "categoryName" | "walletName"
    >
  >;

export function ImportsWorkspace({
  categories,
  initialImports,
  initialSelectedImport,
  wallets,
}: ImportsWorkspaceProps) {
  const router = useRouter();
  const [imports, setImports] = useState(() => [...initialImports]);
  const [selected, setSelected] = useState<ImportRequest | null>(
    initialSelectedImport,
  );
  const [openingImportId, setOpeningImportId] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [toast, setToast] = useState<SystemToastMessage | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [selectedImportIds, setSelectedImportIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const [uploadingImport, setUploadingImport] = useState(false);

  function showToast(tone: "success" | "error", message: string) {
    setToast({ id: Date.now(), tone, message });
  }

  async function refreshImport(id: string) {
    const response = await fetch(`/api/imports/${id}`);
    const body = (await response.json()) as ImportApiResponse;

    if (!response.ok || !body.importRequest) {
      showToast("error", body.error ?? "Nao foi possivel carregar importacao");
      return;
    }

    updateSelectedImport(body.importRequest as ImportRequest);
  }

  async function openImport(id: string) {
    setOpeningImportId(id);

    try {
      const response = await fetch(`/api/imports/${id}`);
      const body = (await response.json()) as ImportApiResponse;

      if (!response.ok || !body.importRequest) {
        showToast("error", body.error ?? "Nao foi possivel carregar importacao");
        return;
      }

      setSelected(body.importRequest);
    } catch {
      showToast("error", "Nao foi possivel carregar importacao");
    } finally {
      setOpeningImportId(null);
    }
  }

  function updateSelectedImport(importRequest: ImportRequest) {
    setSelected(importRequest);
    setImports((current) =>
      current.map((item) =>
        item.id === importRequest.id
          ? toImportRequestSummaryView(importRequest)
          : item,
      ),
    );
  }

  function replaceImportRow(importRequestId: string, row: ImportRow) {
    if (!selected || selected.id !== importRequestId) return;

    updateSelectedImport({
      ...selected,
      rows: selected.rows.map((currentRow) =>
        currentRow.id === row.id ? row : currentRow,
      ),
    });
  }

  function patchImportRow(
    importRequestId: string,
    rowId: string,
    patch: Partial<ImportRow>,
  ) {
    if (!selected || selected.id !== importRequestId) return;

    updateSelectedImport({
      ...selected,
      rows: selected.rows.map((currentRow) =>
        currentRow.id === rowId ? { ...currentRow, ...patch } : currentRow,
      ),
    });
  }

  function removeImportRows(importRequestId: string, rowIds: readonly string[]) {
    const rowIdSet = new Set(rowIds);
    if (!selected || selected.id !== importRequestId) return;

    updateSelectedImport({
      ...selected,
      rows: selected.rows.filter((row) => !rowIdSet.has(row.id)),
    });
  }

  async function createImport(formData: FormData) {
    setUploadingImport(true);
    try {
      const response = await fetch("/api/imports", {
        method: "POST",
        body: formData,
      });
      const body = (await response.json()) as ImportApiResponse;

      if (!response.ok || !body.importRequest) {
        showToast("error", body.error ?? "Nao foi possivel importar arquivo");
        return;
      }

      const importRequest = body.importRequest as ImportRequest;
      setImports((current) => [toImportRequestSummaryView(importRequest), ...current]);
      setSelected(importRequest);
      setShowUpload(false);
      showToast("success", "Arquivo enviado para revisao");
    } catch {
      showToast("error", "Nao foi possivel importar arquivo");
    } finally {
      setUploadingImport(false);
    }
  }

  async function confirmImport(id: string) {
    if (confirming) return;
    setConfirming(true);

    try {
      const response = await fetch(`/api/imports/${id}/confirm`, { method: "POST" });
      const body = (await response.json()) as ImportApiResponse;

      if (!response.ok) {
        showToast("error", body.error ?? "Nao foi possivel confirmar importacao");
        setConfirming(false);
        return;
      }

      const result = body.result;
      if (result?.startDate && result.endDate) {
        const params = new URLSearchParams({
          startDate: result.startDate,
          endDate: result.endDate,
          importedCount: String(result.importedCount),
        });
        router.push(`/transactions?${params.toString()}`);
        return;
      }

      await refreshImport(id);
      showToast(
        "success",
        `Importacao confirmada: ${result?.importedCount ?? 0} lancamentos criados`,
      );
      setConfirming(false);
    } catch {
      showToast("error", "Nao foi possivel confirmar importacao");
      setConfirming(false);
    }
  }

  function toggleImportSelection(id: string) {
    setSelectedImportIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAllImports() {
    setSelectedImportIds((current) =>
      current.size === imports.length ? new Set() : new Set(imports.map((item) => item.id)),
    );
  }

  async function removeSelectedImports() {
    const ids = [...selectedImportIds];
    if (ids.length === 0) return;
    if (!window.confirm(`Remover ${ids.length} importacao(oes) selecionada(s)? Os lancamentos confirmados serao preservados.`)) return;

    try {
      const response = await fetch("/api/imports", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      const body = (await response.json()) as ImportApiResponse;

      if (!response.ok) {
        showToast("error", body.error ?? "Nao foi possivel remover importacoes");
        return;
      }

      const removedIds = new Set(body.deletedImportIds ?? ids);
      setImports((current) => current.filter((item) => !removedIds.has(item.id)));
      setSelectedImportIds(new Set());
      if (selected && removedIds.has(selected.id)) setSelected(null);
      showToast("success", "Importacoes selecionadas removidas");
    } catch {
      showToast("error", "Nao foi possivel remover importacoes");
    }
  }

  if (selected) {
    return (
      <>
        {toast ? <SystemToast onDismiss={() => setToast(null)} toast={toast} /> : null}
        <ImportReview
          categories={categories}
          importRequest={selected}
          onBack={() => setSelected(null)}
          onPatchRow={(rowId, patch) => patchImportRow(selected.id, rowId, patch)}
          onRefresh={() => refreshImport(selected.id)}
          onRemoveRows={(rowIds) => removeImportRows(selected.id, rowIds)}
          onReplaceRow={(row) => replaceImportRow(selected.id, row)}
          onToast={showToast}
          confirming={confirming}
          onConfirm={() => void confirmImport(selected.id)}
          wallets={wallets}
        />
      </>
    );
  }

  return (
    <div className="flex flex-col gap-4 lg:gap-6">
      {toast ? <SystemToast onDismiss={() => setToast(null)} toast={toast} /> : null}
      {showUpload ? (
        <UploadImportDialog
          categories={categories}
          onClose={() => setShowUpload(false)}
          onSubmit={(formData) => void createImport(formData)}
          pending={uploadingImport}
          wallets={wallets}
        />
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <button
          className="flex h-8 items-center gap-2 rounded-lg border border-border bg-panel px-3 text-xs font-medium text-muted transition hover:bg-surface hover:text-foreground"
          onClick={toggleAllImports}
          type="button"
        >
          {selectedImportIds.size === imports.length && imports.length > 0 ? (
            <CheckSquare className="size-3.5 text-accent" aria-hidden="true" />
          ) : (
            <Square className="size-3.5" aria-hidden="true" />
          )}
          {selectedImportIds.size === imports.length && imports.length > 0 ? "Desmarcar todas" : "Selecionar todas"}
        </button>
        {selectedImportIds.size > 0 ? (
          <button
            className="flex h-8 items-center gap-1.5 rounded-lg border border-negative/40 bg-negative/10 px-3 text-xs font-medium text-negative transition hover:bg-negative/20"
            onClick={() => void removeSelectedImports()}
            type="button"
          >
            <Trash2 className="size-3.5" aria-hidden="true" />
            Remover {selectedImportIds.size}
          </button>
        ) : null}
        <div className="flex-1" />
        <button
          className="flex h-8 items-center gap-1.5 rounded-lg bg-accent px-3 text-xs font-semibold text-accent-foreground transition hover:bg-accent/90"
          onClick={() => setShowUpload(true)}
          type="button"
        >
          <Plus className="size-3.5" aria-hidden="true" />
          Adicionar
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-xs">
            <thead>
              <tr className="border-b border-border bg-panel">
                {["", "Criado em", "Arquivo", "Origem", "Status", "Total", "Pendentes", "Ignoradas", ""].map((heading, index) => (
                  <th
                    className={`px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted ${
                      ["Total", "Pendentes", "Ignoradas"].includes(heading) ? "text-right" : "text-left"
                    }`}
                    key={`${heading}-${index}`}
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-panel">
              {imports.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-center text-xs italic text-muted" colSpan={9}>
                    Nenhuma importacao encontrada.
                  </td>
                </tr>
              ) : null}
              {imports.map((item) => {
                const selectedImport = selectedImportIds.has(item.id);
                return (
                  <tr
                    className={`cursor-pointer transition hover:bg-surface-elevated ${selectedImport ? "bg-accent/5" : ""}`}
                    key={item.id}
                    onClick={() => void openImport(item.id)}
                  >
                    <td className="px-4 py-3">
                      <button
                        aria-label={selectedImport ? "Desmarcar importacao" : "Selecionar importacao"}
                        className="flex size-5 items-center justify-center text-muted transition hover:text-foreground"
                        onClick={(event) => {
                          event.stopPropagation();
                          toggleImportSelection(item.id);
                        }}
                        type="button"
                      >
                        {selectedImport ? <CheckSquare className="size-3.5 text-accent" aria-hidden="true" /> : <Square className="size-3.5" aria-hidden="true" />}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-muted">{formatDateTime(item.createdAt)}</td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-2 font-semibold text-foreground">
                        <FileText className="size-3.5 text-muted" aria-hidden="true" />
                        {item.fileName}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted">{importSourceLabels[item.source]}</td>
                    <td className="px-4 py-3"><StatusBadge label={importStatusLabels[item.status]} /></td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums">{item.totalRows}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-warning">{item.pendingRows}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted">{item.ignoredRows}</td>
                    <td className="px-4 py-3 text-right text-accent">
                      {openingImportId === item.id ? "Abrindo..." : "Revisar"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <button
          className="flex w-full items-center justify-center gap-1.5 border-t border-dashed border-border py-3 text-xs font-medium text-muted transition hover:bg-surface-elevated hover:text-foreground"
          onClick={() => setShowUpload(true)}
          type="button"
        >
          <Plus className="size-3.5" aria-hidden="true" />
          Adicionar importacao
        </button>
      </div>
    </div>
  );
}

function ImportReview({
  categories,
  confirming,
  importRequest,
  onBack,
  onConfirm,
  onPatchRow,
  onRefresh,
  onRemoveRows,
  onReplaceRow,
  onToast,
  wallets,
}: {
  readonly categories: readonly Category[];
  readonly confirming: boolean;
  readonly importRequest: ImportRequest;
  readonly onBack: () => void;
  readonly onConfirm: () => void;
  readonly onPatchRow: (rowId: string, patch: Partial<ImportRow>) => void;
  readonly onRefresh: () => void | Promise<void>;
  readonly onRemoveRows: (rowIds: readonly string[]) => void;
  readonly onReplaceRow: (row: ImportRow) => void;
  readonly onToast: (tone: "success" | "error", message: string) => void;
  readonly wallets: readonly Wallet[];
}) {
  const tableRef = useRef<HTMLTableElement | null>(null);
  const [savingFields, setSavingFields] = useState<ReadonlyMap<string, number>>(
    () => new Map(),
  );
  const [selectedRowIds, setSelectedRowIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const [viewMode, setViewMode] = useState<ImportRowsViewMode>("status");
  const [showBulkEdit, setShowBulkEdit] = useState(false);
  const [attachmentTarget, setAttachmentTarget] =
    useState<ImportAttachmentTarget | null>(null);
  const [attachments, setAttachments] = useState<ImportAttachmentWithPreview[]>(
    [],
  );
  const [attachmentsLoading, setAttachmentsLoading] = useState(false);
  const [attachmentUploading, setAttachmentUploading] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<
    ReadonlySet<ImportRowViewStatus>
  >(() => new Set());
  const [statusBeforeEditingByRow, setStatusBeforeEditingByRow] = useState<
    ReadonlyMap<string, ImportRowViewStatus>
  >(() => new Map());
  const confirmed = importRequest.status === "CONFIRMED";
  const totals = summarizeRows(importRequest.rows);
  const readinessDefaults = useMemo(
    () => ({
      defaultCategoryId: importRequest.defaultCategoryId,
      defaultWalletId: importRequest.defaultWalletId,
      nature: importRequest.nature,
    }),
    [
      importRequest.defaultCategoryId,
      importRequest.defaultWalletId,
      importRequest.nature,
    ],
  );
  const orderedRows = useMemo(
    () => orderImportRowsByDate(importRequest.rows),
    [importRequest.rows],
  );
  const statusGroups = useMemo(
    () =>
      groupImportRowsByStatus(
        importRequest.rows,
        readinessDefaults,
        statusBeforeEditingByRow,
      ),
    [importRequest.rows, readinessDefaults, statusBeforeEditingByRow],
  );
  const navigationRows = useMemo(
    () =>
      viewMode === "status"
        ? statusGroups.flatMap((group) =>
            collapsedGroups.has(group.key) ? [] : group.rows,
          )
        : orderedRows,
    [collapsedGroups, orderedRows, statusGroups, viewMode],
  );
  const allSelected =
    importRequest.rows.length > 0 && selectedRowIds.size === importRequest.rows.length;

  function toggleAllRows() {
    setSelectedRowIds((current) =>
      current.size === importRequest.rows.length
        ? new Set()
        : new Set(importRequest.rows.map((row) => row.id)),
    );
  }

  function toggleRow(rowId: string) {
    setSelectedRowIds((current) => {
      const next = new Set(current);
      if (next.has(rowId)) next.delete(rowId);
      else next.add(rowId);
      return next;
    });
  }

  function selectedRows() {
    return importRequest.rows.filter((row) => selectedRowIds.has(row.id));
  }

  function clearSelection() {
    setSelectedRowIds(new Set());
    setShowBulkEdit(false);
  }

  function preserveStatusWhileEditing(row: ImportRow) {
    setStatusBeforeEditingByRow((current) => {
      if (current.has(row.id)) return current;

      const next = new Map(current);
      next.set(row.id, getImportRowViewStatus(row, readinessDefaults));
      return next;
    });
  }

  function releaseStatusAfterEditing(event: FocusEvent<HTMLTableRowElement>) {
    const rowElement = event.currentTarget;

    window.setTimeout(() => {
      if (rowElement.contains(document.activeElement)) return;

      setStatusBeforeEditingByRow((current) => {
        if (!current.has(rowElement.dataset.importRowId ?? "")) return current;

        const next = new Map(current);
        next.delete(rowElement.dataset.importRowId ?? "");
        return next;
      });
    }, 0);
  }

  function toggleGroup(status: ImportRowViewStatus) {
    setCollapsedGroups((current) => {
      const next = new Set(current);
      if (next.has(status)) next.delete(status);
      else next.add(status);
      return next;
    });
  }

  async function openAttachments(target: ImportAttachmentTarget) {
    setAttachmentTarget(target);
    setAttachments([]);
    setAttachmentsLoading(true);

    try {
      const response = await fetch(importAttachmentUrl(target));
      const body = (await response.json()) as ImportAttachmentApiResponse;

      if (!response.ok) {
        onToast("error", body.error ?? "Nao foi possivel carregar anexos");
        return;
      }

      setAttachments(body.attachments ?? []);
    } catch {
      onToast("error", "Nao foi possivel carregar anexos");
    } finally {
      setAttachmentsLoading(false);
    }
  }

  async function uploadAttachment(formData: FormData): Promise<boolean> {
    if (!attachmentTarget) return false;

    setAttachmentUploading(true);

    try {
      const response = await fetch(importAttachmentUrl(attachmentTarget), {
        method: "POST",
        body: formData,
      });
      const body = (await response.json()) as ImportAttachmentApiResponse;

      if (!response.ok || !body.attachment) {
        onToast("error", body.error ?? "Nao foi possivel enviar anexo");
        return false;
      }

      onToast("success", "Anexo enviado com sucesso");
      setAttachmentTarget(null);
      await onRefresh();
      return true;
    } catch {
      onToast("error", "Nao foi possivel enviar anexo");
      return false;
    } finally {
      setAttachmentUploading(false);
    }
  }

  async function patchRow(row: ImportRow, patch: ImportRowOptimisticPatch) {
    const optimisticPatch: Partial<ImportRow> = {
      ...patch,
      updatedAt: new Date(),
    };
    const fields = getSavingFieldsFromPatch(patch);
    onPatchRow(row.id, optimisticPatch);
    setSavingFields((current) => addSavingFields(current, row.id, fields));

    const response = await sendImportJson(
      `/api/imports/${importRequest.id}/rows/${row.id}`,
      rowToPatchBody(row, patch),
      "PATCH",
    );

    setSavingFields((current) => removeSavingFields(current, row.id, fields));

    if (!response.ok || !response.body.row) {
      onRefresh();
      onToast("error", response.body.error ?? "Nao foi possivel salvar linha");
      return;
    }

    onReplaceRow(response.body.row);
  }

  async function setIgnored(row: ImportRow, ignored: boolean) {
    onPatchRow(row.id, {
      ignoredAt: ignored ? new Date() : null,
      updatedAt: new Date(),
    });
    setSavingFields((current) =>
      addSavingFields(current, row.id, ["ignoredAt"]),
    );

    const response = await sendImportJson(
      `/api/imports/${importRequest.id}/rows/${row.id}`,
      { ignored },
      "PATCH",
    );
    setSavingFields((current) =>
      removeSavingFields(current, row.id, ["ignoredAt"]),
    );

    if (!response.ok) {
      onRefresh();
      onToast("error", response.body.error ?? "Nao foi possivel atualizar linha");
      return;
    }

    if (response.body.row) {
      onReplaceRow(response.body.row);
    }
  }

  async function setSelectedIgnored(ignored: boolean) {
    await Promise.all(
      selectedRows().map((row) =>
        row.entryId ? Promise.resolve() : setIgnored(row, ignored),
      ),
    );
    onToast(
      "success",
      ignored ? "Linhas selecionadas ignoradas" : "Linhas selecionadas concluidas",
    );
  }

  async function concludeSelected() {
    const incomplete = selectedRows().filter(
      (row) => getImportRowViewStatus(row, readinessDefaults) === "pending",
    );

    if (incomplete.length > 0) {
      onToast(
        "error",
        "Preencha carteira, categoria e natureza antes de concluir.",
      );
      return;
    }

    await setSelectedIgnored(false);
  }

  async function removeSelectedRows() {
    const rows = selectedRows();
    const removedIds: string[] = [];

    for (const row of rows) {
      const response = await sendImportJson(
        `/api/imports/${importRequest.id}/rows/${row.id}`,
        undefined,
        "DELETE",
      );

      if (!response.ok) {
        onRefresh();
        onToast("error", response.body.error ?? "Nao foi possivel remover linha");
        return;
      }

      removedIds.push(row.id);
    }

    onRemoveRows(removedIds);
    clearSelection();
    onToast("success", "Linhas selecionadas removidas");
  }

  async function applyBulkEdit(patch: Partial<RowPatch>) {
    const rows = selectedRows();
    const fields = getSavingFieldsFromPatch(patch);

    for (const row of rows) {
      onPatchRow(row.id, { ...patch, updatedAt: new Date() });
      setSavingFields((current) => addSavingFields(current, row.id, fields));
    }

    const response = await sendImportJson(
      `/api/imports/${importRequest.id}/rows`,
      { rowIds: rows.map((row) => row.id), patch },
      "PATCH",
    );

    for (const row of rows) {
      setSavingFields((current) => removeSavingFields(current, row.id, fields));
    }

    if (!response.ok || !response.body.rows) {
      onRefresh();
      onToast("error", response.body.error ?? "Nao foi possivel atualizar linhas");
      return;
    }

    response.body.rows.forEach(onReplaceRow);
    setShowBulkEdit(false);
    onToast("success", "Linhas selecionadas atualizadas");
  }

  function focusImportCell(rowId: string, field: ImportRowNavigationField) {
    const table = tableRef.current;
    if (!table) return;

    const cell = Array.from(
      table.querySelectorAll<HTMLElement>("[data-import-nav-cell='true']"),
    ).find(
      (item) =>
        item.dataset.importRowId === rowId &&
        item.dataset.importField === field,
    );
    const focusTarget = cell?.querySelector<HTMLElement>(
      "input:not([disabled]),button:not([disabled])",
    );

    focusTarget?.focus();
  }

  function handleImportTableKeyDown(event: KeyboardEvent<HTMLTableElement>) {
    if (
      !event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      !["h", "j", "k", "l"].includes(event.key.toLowerCase())
    ) {
      return;
    }

    const target = event.target as HTMLElement | null;
    const cell = target?.closest<HTMLElement>("[data-import-nav-cell='true']");
    const rowId = cell?.dataset.importRowId;
    const field = cell?.dataset.importField as
      | ImportRowNavigationField
      | undefined;

    if (!rowId || !field) return;

    const rowIndex = navigationRows.findIndex((row) => row.id === rowId);
    const fieldIndex = importRowNavigationFields.indexOf(field);
    if (rowIndex < 0 || fieldIndex < 0) return;

    const key = event.key.toLowerCase();
    const nextRowIndex =
      key === "j" ? rowIndex + 1 : key === "k" ? rowIndex - 1 : rowIndex;
    const nextFieldIndex =
      key === "l"
        ? fieldIndex + 1
        : key === "h"
          ? fieldIndex - 1
          : fieldIndex;
    const nextRow = navigationRows[nextRowIndex];
    const nextField = importRowNavigationFields[nextFieldIndex];

    if (!nextRow || !nextField) return;

    event.preventDefault();
    focusImportCell(nextRow.id, nextField);
  }

  function renderRow(row: ImportRow) {
    const rowStatus = getVisibleImportRowStatus(
      row,
      readinessDefaults,
      statusBeforeEditingByRow.get(row.id),
    );
    const selected = selectedRowIds.has(row.id);
    const selectedCategory = row.categoryId
      ? categories.find((category) => category.id === row.categoryId)
      : null;
    const selectedCategoryColor =
      row.categoryColor ?? selectedCategory?.color ?? null;
    const saving = (field: ImportRowSavingField) =>
      savingFields.has(savingFieldKey(row.id, field));

    return (
      <tr
        className={`${row.ignoredAt ? "opacity-55" : ""} ${
          selected ? "bg-accent/5" : ""
        }`}
        key={row.id}
        data-import-row-id={row.id}
        onBlurCapture={releaseStatusAfterEditing}
        onFocusCapture={() => preserveStatusWhileEditing(row)}
      >
        <td className="px-3 py-3">
          <button
            aria-label={selected ? "Desmarcar linha" : "Selecionar linha"}
            className="flex size-5 items-center justify-center text-muted transition hover:text-foreground"
            onClick={() => toggleRow(row.id)}
            type="button"
          >
            {selected ? (
              <CheckSquare className="size-3.5 text-accent" aria-hidden="true" />
            ) : (
              <Square className="size-3.5" aria-hidden="true" />
            )}
          </button>
        </td>
        <td
          className="px-3 py-3"
          data-import-field="occurredOn"
          data-import-nav-cell="true"
          data-import-row-id={row.id}
        >
          <FieldLoading loading={saving("occurredOn")}>
            <CalendarField
              className="w-[118px]"
              disabled={confirmed}
              label="Data"
              onChange={(occurredOn) => void patchRow(row, { occurredOn })}
              value={row.occurredOn}
            />
          </FieldLoading>
        </td>
        <td
          className="px-3 py-3"
          data-import-field="categoryId"
          data-import-nav-cell="true"
          data-import-row-id={row.id}
        >
          <FieldLoading loading={saving("categoryId")}>
            <CategorySelect
              categories={categories}
              disabled={confirmed}
              label={row.categoryName ?? importRequest.defaultCategoryName ?? "Categoria"}
              mode="single"
              onChange={(values) => {
                const categoryId = values[0] ?? null;
                const category = categoryId
                  ? categories.find((item) => item.id === categoryId)
                  : null;

                void patchRow(row, {
                  categoryId,
                  categoryColor: category?.color ?? null,
                  categoryIcon: category?.icon ?? null,
                  categoryName: category?.name ?? null,
                });
              }}
              selectedColor={selectedCategoryColor}
              selectedValues={row.categoryId ? [row.categoryId] : []}
              triggerClassName="w-full"
            />
          </FieldLoading>
        </td>
        <td
          className="px-3 py-3"
          data-import-field="description"
          data-import-nav-cell="true"
          data-import-row-id={row.id}
        >
          <FieldLoading loading={saving("description")}>
            <input
              className={`${inputClass} w-full pr-7`}
              disabled={confirmed}
              onChange={(event) =>
                void patchRow(row, { description: event.target.value })
              }
              value={row.description ?? ""}
            />
          </FieldLoading>
        </td>
        <td
          className="px-3 py-3"
          data-import-field="walletId"
          data-import-nav-cell="true"
          data-import-row-id={row.id}
        >
          <FieldLoading loading={saving("walletId")}>
            <InlineDropdown
              disabled={confirmed}
              emptyLabel="A definir"
              onChange={(walletId) => void patchRow(row, { walletId })}
              options={wallets.map((wallet) => ({
                label: wallet.name,
                value: wallet.id,
              }))}
              value={row.walletId}
            />
          </FieldLoading>
        </td>
        <td
          className="px-3 py-3"
          data-import-field="economicEvent"
          data-import-nav-cell="true"
          data-import-row-id={row.id}
        >
          <FieldLoading loading={saving("economicEvent")}>
            <InlineDropdown
              disabled={confirmed}
              emptyLabel="Automatico"
              onChange={(economicEvent) =>
                void patchRow(row, {
                  economicEvent: economicEvent as EconomicEvent | null,
                })
              }
              options={economicEvents.map((event) => ({
                label: economicEventLabels[event],
                value: event,
              }))}
              value={row.economicEvent}
            />
          </FieldLoading>
        </td>
        <td
          className="px-3 py-3"
          data-import-field="amountCents"
          data-import-nav-cell="true"
          data-import-row-id={row.id}
        >
          <FieldLoading loading={saving("amountCents")}>
            <CurrencyField
              aria-label="Valor"
              className="h-9 w-[124px] pr-7"
              disabled={confirmed}
              onValueInCentsChange={(amountCents) =>
                void patchRow(row, { amountCents })
              }
              valueInCents={row.amountCents}
            />
          </FieldLoading>
        </td>
        <td className="px-3 py-3">
          <div className="flex items-center gap-2">
            <StatusBadge
              label={importRowStatusLabels[rowStatus]}
              tone={statusToneByRowStatus[rowStatus]}
            />
            {saving("ignoredAt") ? (
              <Loader2 className="size-3 animate-spin text-muted" />
            ) : null}
          </div>
        </td>
        <td className="px-3 py-3">
          <div className="flex justify-end gap-1">
            <button
              className={iconButtonClass}
              onClick={() =>
                void openAttachments({
                  importRequestId: importRequest.id,
                  importRowId: row.id,
                  title: row.description
                    ? `Anexos de ${row.description}`
                    : `Anexos da linha ${row.rowNumber}`,
                })
              }
              title={
                row.attachmentCount > 0
                  ? `${row.attachmentCount} anexo(s)`
                  : "Adicionar anexo"
              }
              type="button"
            >
              <Paperclip
                className={`size-3.5 ${
                  row.attachmentCount > 0 ? "text-accent" : ""
                }`}
                aria-hidden="true"
              />
              <span className="sr-only">Anexos</span>
            </button>
            {row.ignoredAt ? (
              <button className={iconButtonClass} disabled={confirmed} onClick={() => void setIgnored(row, false)} title="Restaurar" type="button">
                <RotateCcw className="size-3.5" />
              </button>
            ) : (
              <button className={iconButtonClass} disabled={confirmed} onClick={() => void setIgnored(row, true)} title="Ignorar" type="button">
                <Ban className="size-3.5" />
              </button>
            )}
          </div>
        </td>
      </tr>
    );
  }

  return (
    <div className="flex flex-col gap-4 lg:gap-6">
      {attachmentTarget ? (
        <ImportAttachmentsDialog
          attachments={attachments}
          loading={attachmentsLoading}
          onClose={() => setAttachmentTarget(null)}
          onSubmit={uploadAttachment}
          target={attachmentTarget}
          uploading={attachmentUploading}
        />
      ) : null}

      <div className="flex items-start gap-3">
        <button className={iconButtonClass} onClick={onBack} type="button">
          <ChevronLeft className="size-4" aria-hidden="true" />
          <span className="sr-only">Voltar</span>
        </button>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-lg font-semibold tracking-tight">
            {importRequest.fileName}
          </h2>
          <p className="mt-1 text-xs text-muted">
            {importSourceLabels[importRequest.source]} · {formatDateTime(importRequest.createdAt)}
          </p>
        </div>
        <button
          className="flex h-9 items-center gap-2 rounded-lg border border-border bg-panel px-4 text-xs font-semibold text-foreground transition hover:bg-surface"
          onClick={() =>
            void openAttachments({
              importRequestId: importRequest.id,
              importRowId: null,
              title: "Fatura da importacao",
            })
          }
          type="button"
        >
          <Paperclip className="size-3.5" aria-hidden="true" />
          Fatura
          {importRequest.attachmentCount > 0 ? (
            <span className="rounded-full bg-accent/15 px-1.5 py-0.5 text-[10px] text-accent">
              {importRequest.attachmentCount}
            </span>
          ) : null}
        </button>
        <button
          className="flex h-9 items-center gap-2 rounded-lg bg-accent px-4 text-xs font-bold text-accent-foreground transition hover:bg-accent/90 disabled:opacity-60"
          aria-busy={confirming}
          disabled={confirmed || confirming || totals.active === 0}
          onClick={onConfirm}
          type="button"
        >
          {confirming ? <Loader2 className="size-3.5 animate-spin" aria-hidden="true" /> : <Check className="size-3.5" aria-hidden="true" />}
          {confirming ? "Confirmando..." : "Confirmar importacao"}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Total" value={String(importRequest.rows.length)} />
        <KpiCard label="A revisar" tone="warning" value={String(totals.active)} />
        <KpiCard label="Ignoradas" value={String(totals.ignored)} />
        <KpiCard label="Confirmadas" tone="positive" value={String(totals.confirmed)} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          className="flex h-8 items-center gap-2 rounded-lg border border-border bg-panel px-3 text-xs font-medium text-muted transition hover:bg-surface hover:text-foreground"
          onClick={toggleAllRows}
          type="button"
        >
          {allSelected ? (
            <CheckSquare className="size-3.5 text-accent" aria-hidden="true" />
          ) : (
            <Square className="size-3.5" aria-hidden="true" />
          )}
          {allSelected ? "Desmarcar todos" : "Selecionar todos"}
        </button>

        {selectedRowIds.size > 0 ? (
          <>
            <button
              className="flex h-8 items-center gap-1.5 rounded-lg border border-accent/40 bg-accent/10 px-3 text-xs font-medium text-accent transition hover:bg-accent/20"
              onClick={() => setShowBulkEdit((current) => !current)}
              type="button"
            >
              <Pencil className="size-3.5" aria-hidden="true" />
              Editar {selectedRowIds.size}
            </button>
            <button
              className="flex h-8 items-center gap-1.5 rounded-lg border border-positive/40 bg-positive/10 px-3 text-xs font-medium text-positive transition hover:bg-positive/20"
              onClick={() => void concludeSelected()}
              type="button"
            >
              <Check className="size-3.5" aria-hidden="true" />
              Concluir {selectedRowIds.size}
            </button>
            <button
              className="flex h-8 items-center gap-1.5 rounded-lg border border-border bg-panel px-3 text-xs font-medium text-muted transition hover:bg-surface hover:text-foreground"
              onClick={() => void setSelectedIgnored(true)}
              type="button"
            >
              <Ban className="size-3.5" aria-hidden="true" />
              Ignorar {selectedRowIds.size}
            </button>
            <button
              className="flex h-8 items-center gap-1.5 rounded-lg border border-negative/40 bg-negative/10 px-3 text-xs font-medium text-negative transition hover:bg-negative/20"
              onClick={() => void removeSelectedRows()}
              type="button"
            >
              <Trash2 className="size-3.5" aria-hidden="true" />
              Remover {selectedRowIds.size}
            </button>
          </>
        ) : null}

        <div className="flex-1" />

        <div className="flex items-center gap-0.5 rounded-lg border border-border bg-panel p-0.5">
          <ViewModeButton
            active={viewMode === "status"}
            icon={<LayoutList className="size-3.5" aria-hidden="true" />}
            label="Por status"
            onClick={() => setViewMode("status")}
          />
          <ViewModeButton
            active={viewMode === "date"}
            icon={<CalendarDays className="size-3.5" aria-hidden="true" />}
            label="Por data"
            onClick={() => setViewMode("date")}
          />
        </div>
      </div>

      {showBulkEdit && selectedRowIds.size > 0 ? (
        <BulkEditPanel
          categories={categories}
          count={selectedRowIds.size}
          onApply={(patch) => void applyBulkEdit(patch)}
          onClose={() => setShowBulkEdit(false)}
          wallets={wallets}
        />
      ) : null}

      <div className="overflow-hidden rounded-xl border border-border">
        <div className="overflow-x-auto">
          <table
            className="w-full min-w-[1356px] table-fixed text-xs"
            onKeyDown={handleImportTableKeyDown}
            ref={tableRef}
          >
            <colgroup>
              <col className="w-[44px]" />
              <col className="w-[142px]" />
              <col className="w-[200px]" />
              <col className="w-[340px]" />
              <col className="w-[160px]" />
              <col className="w-[170px]" />
              <col className="w-[148px]" />
              <col className="w-[100px]" />
              <col className="w-[52px]" />
            </colgroup>
            <thead>
              <tr className="border-b border-border bg-panel">
                {["", "Data", "Categoria", "Descricao", "Carteira", "Evento", "Valor", "Status", ""].map((heading, index) => (
                  <th
                    className={`px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted ${
                      heading === "Valor" ? "text-right" : "text-left"
                    }`}
                    key={`${heading || "empty"}-${index}`}
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className={viewMode === "date" ? "divide-y divide-border bg-panel" : "bg-panel"}>
              {viewMode === "status"
                ? statusGroups.flatMap((group) => [
                    <tr className="border-t border-border first:border-t-0" key={`group-${group.key}`}>
                      <td className="bg-surface/70 px-3 py-2" colSpan={9}>
                        <button
                          className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-muted transition hover:text-foreground"
                          onClick={() => toggleGroup(group.key)}
                          type="button"
                        >
                          <ChevronDown
                            className={`size-3 transition ${
                              collapsedGroups.has(group.key) ? "-rotate-90" : ""
                            }`}
                            aria-hidden="true"
                          />
                          <StatusBadge
                            label={group.label}
                            tone={statusToneByRowStatus[group.key]}
                          />
                          <span>{group.count}</span>
                        </button>
                      </td>
                    </tr>,
                    ...(collapsedGroups.has(group.key) ? [] : group.rows.map(renderRow)),
                  ])
                : orderedRows.map(renderRow)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ViewModeButton({
  active,
  icon,
  label,
  onClick,
}: {
  readonly active: boolean;
  readonly icon: ReactNode;
  readonly label: string;
  readonly onClick: () => void;
}) {
  return (
    <button
      className={`flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition ${
        active
          ? "bg-accent/15 text-accent"
          : "text-muted hover:bg-surface hover:text-foreground"
      }`}
      onClick={onClick}
      type="button"
    >
      {icon}
      {label}
    </button>
  );
}

function ImportAttachmentsDialog({
  attachments,
  loading,
  onClose,
  onSubmit,
  target,
  uploading,
}: {
  readonly attachments: readonly ImportAttachmentWithPreview[];
  readonly loading: boolean;
  readonly onClose: () => void;
  readonly onSubmit: (formData: FormData) => Promise<boolean>;
  readonly target: ImportAttachmentTarget;
  readonly uploading: boolean;
}) {
  const formRef = useRef<HTMLFormElement | null>(null);
  const [fileName, setFileName] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (uploading) return;

    const form = event.currentTarget;
    const uploaded = await onSubmit(new FormData(form));

    if (uploaded) {
      form.reset();
      setFileName("");
    }
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-background/70 px-4 backdrop-blur-sm">
      <div
        aria-modal="true"
        className="flex max-h-[calc(100vh-2rem)] w-[min(560px,calc(100vw-2rem))] flex-col overflow-hidden rounded-xl border border-border bg-surface-elevated shadow-2xl shadow-black/55"
        role="dialog"
      >
        <div className="flex shrink-0 items-start justify-between border-b border-border px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-foreground">Anexos</h2>
            <p className="mt-1 truncate text-xs text-muted">{target.title}</p>
          </div>
          <button className={iconButtonClass} onClick={onClose} type="button">
            <X className="size-3.5" aria-hidden="true" />
          </button>
        </div>

        <form className="flex min-h-0 flex-1 flex-col" onSubmit={submit} ref={formRef}>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="grid gap-4 px-5 py-4">
              <label
                className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border px-4 py-7 text-center transition ${
                  uploading
                    ? "cursor-wait bg-surface opacity-75"
                    : "cursor-pointer hover:border-accent/60 hover:bg-surface"
                }`}
              >
                {uploading ? (
                  <Loader2 className="size-6 animate-spin text-accent" />
                ) : fileName ? (
                  <FileText className="size-6 text-accent" />
                ) : (
                  <Upload className="size-6 text-muted" />
                )}
                <span className="text-xs font-semibold">
                  {uploading
                    ? "Enviando documento..."
                    : fileName || "Clique para selecionar um documento"}
                </span>
                <span className="text-[10px] text-muted">
                  PDF, JPG, PNG ou WebP, maximo 10 MB
                </span>
                <input
                  accept="application/pdf,image/jpeg,image/png,image/webp"
                  className="hidden"
                  disabled={uploading}
                  name="file"
                  onChange={(event) =>
                    setFileName(event.target.files?.[0]?.name ?? "")
                  }
                  required
                  type="file"
                />
              </label>
            </div>

            <div className="border-t border-border px-5 py-4">
              {loading ? (
                <div className="grid gap-3" aria-busy="true">
                  <div className="flex items-center gap-2 text-xs font-semibold text-muted">
                    <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                    Carregando documentos anexados...
                  </div>
                  <SkeletonBlock />
                  <SkeletonBlock />
                </div>
              ) : attachments.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {attachments.map((attachment) => (
                    <ImportAttachmentCard
                      attachment={attachment}
                      key={attachment.id}
                    />
                  ))}
                </div>
              ) : (
                <p className="py-4 text-center text-xs italic text-muted">
                  Nenhum anexo enviado.
                </p>
              )}
            </div>
          </div>

          <div className="flex shrink-0 justify-end gap-2 border-t border-border bg-surface-elevated px-5 py-4">
            <button
              className="h-9 rounded-lg border border-border bg-panel px-4 text-xs font-semibold text-foreground transition hover:bg-surface disabled:opacity-60"
              disabled={uploading}
              onClick={onClose}
              type="button"
            >
              Fechar
            </button>
            <button
              className="flex h-9 items-center gap-2 rounded-lg bg-accent px-4 text-xs font-bold text-accent-foreground transition hover:bg-accent/90 disabled:opacity-60"
              disabled={uploading}
              type="submit"
            >
              {uploading ? (
                <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <Upload className="size-3.5" aria-hidden="true" />
              )}
              {uploading ? "Enviando..." : "Enviar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ImportAttachmentCard({
  attachment,
}: {
  readonly attachment: ImportAttachmentWithPreview;
}) {
  const image = attachment.mimeType.startsWith("image/");

  return (
    <a
      className="overflow-hidden rounded-lg border border-border bg-panel transition hover:border-accent/50 hover:bg-surface"
      href={attachment.signedUrl}
      rel="noreferrer"
      target="_blank"
    >
      <div className="flex aspect-video items-center justify-center bg-surface">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt={attachment.originalFileName}
            className="h-full w-full object-cover"
            src={attachment.signedUrl}
          />
        ) : (
          <FileText className="size-7 text-muted" aria-hidden="true" />
        )}
      </div>
      <div className="grid gap-1 px-3 py-2">
        <span className="truncate text-xs font-semibold">
          {attachment.originalFileName}
        </span>
        <span className="text-[10px] text-muted">
          {formatFileSize(attachment.sizeBytes)} - {formatDateTime(attachment.createdAt)}
        </span>
      </div>
    </a>
  );
}

function FieldLoading({
  children,
  loading,
}: {
  readonly children: ReactNode;
  readonly loading: boolean;
}) {
  return (
    <div className="relative">
      {children}
      {loading ? (
        <span className="pointer-events-none absolute right-2 top-1/2 flex -translate-y-1/2 items-center rounded-full bg-panel/80 p-0.5">
          <Loader2 className="size-3 animate-spin text-muted" aria-hidden="true" />
        </span>
      ) : null}
    </div>
  );
}

type BulkFieldValue = string | null | undefined;

function BulkEditPanel({
  categories,
  count,
  onApply,
  onClose,
  wallets,
}: {
  readonly categories: readonly Category[];
  readonly count: number;
  readonly onApply: (patch: Partial<RowPatch>) => void;
  readonly onClose: () => void;
  readonly wallets: readonly Wallet[];
}) {
  const [walletId, setWalletId] = useState<BulkFieldValue>(undefined);
  const [categoryId, setCategoryId] = useState<BulkFieldValue>(undefined);
  const [nature, setNature] = useState<BulkFieldValue>(undefined);
  const [economicEvent, setEconomicEvent] = useState<BulkFieldValue>(undefined);

  function apply() {
    const patch: MutableRowPatch = {};
    if (walletId !== undefined) patch.walletId = walletId;
    if (categoryId !== undefined) patch.categoryId = categoryId;
    if (nature !== undefined) patch.nature = nature as EntryNature | null;
    if (economicEvent !== undefined) {
      patch.economicEvent = economicEvent as EconomicEvent | null;
    }
    onApply(patch);
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-accent/30 bg-accent/5 px-4 py-3">
      <span className="text-xs font-medium text-accent whitespace-nowrap">
        Editando {count} selecionados
      </span>
      <div className="flex flex-1 flex-wrap items-center gap-2">
        <BulkDropdown
          label="Carteira"
          onChange={setWalletId}
          options={wallets.map((wallet) => ({
            label: wallet.name,
            value: wallet.id,
          }))}
          value={walletId}
        />
        <BulkDropdown
          label="Categoria"
          onChange={setCategoryId}
          options={categories.map((category) => ({
            label: category.name,
            value: category.id,
          }))}
          value={categoryId}
        />
        <BulkDropdown
          label="Natureza"
          onChange={setNature}
          options={entryNatures.map((option) => ({
            label: entryNatureLabels[option],
            value: option,
          }))}
          value={nature}
        />
        <BulkDropdown
          label="Evento"
          onChange={setEconomicEvent}
          options={economicEvents.map((option) => ({
            label: economicEventLabels[option],
            value: option,
          }))}
          value={economicEvent}
        />
      </div>
      <button
        className="h-8 rounded-lg bg-accent px-3 text-xs font-bold text-accent-foreground transition hover:bg-accent/90"
        onClick={apply}
        type="button"
      >
        Aplicar
      </button>
      <button
        aria-label="Fechar edicao em lote"
        className="flex size-7 items-center justify-center rounded-md text-muted transition hover:bg-surface hover:text-foreground"
        onClick={onClose}
        type="button"
      >
        <X className="size-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}

function BulkDropdown({
  label,
  onChange,
  options,
  value,
}: {
  readonly label: string;
  readonly onChange: (value: BulkFieldValue) => void;
  readonly options: readonly { label: string; value: string }[];
  readonly value: BulkFieldValue;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);
  const selectedLabel =
    value === undefined ? "Nenhuma" : value === null ? "Limpar" : selected?.label ?? "Nenhuma";

  return (
    <Dropdown
      onOpenChange={setOpen}
      open={open}
      panelClassName="overflow-hidden rounded-lg border border-border bg-surface-elevated shadow-2xl shadow-black/45"
      trigger={({ open: dropdownOpen, triggerRef }) => (
        <button
          aria-expanded={dropdownOpen}
          className="flex h-8 min-w-36 items-center justify-between gap-2 rounded-lg border border-border bg-panel px-3 text-left text-xs font-semibold text-foreground transition hover:bg-surface"
          onClick={() => setOpen((current) => !current)}
          ref={(node) => {
            triggerRef.current = node;
          }}
          type="button"
        >
          <span className="truncate">
            {label}: {selectedLabel}
          </span>
          <ChevronDown
            className={`size-3.5 shrink-0 text-muted transition ${
              dropdownOpen ? "rotate-180" : ""
            }`}
            aria-hidden="true"
          />
        </button>
      )}
      width="trigger"
    >
      <div className="grid py-1">
        <button
          className="min-h-8 px-3 text-left text-xs font-semibold text-muted transition hover:bg-surface hover:text-foreground"
          onClick={() => {
            onChange(undefined);
            setOpen(false);
          }}
          type="button"
        >
          Nenhuma
        </button>
        <button
          className="min-h-8 px-3 text-left text-xs font-semibold text-muted transition hover:bg-surface hover:text-foreground"
          onClick={() => {
            onChange(null);
            setOpen(false);
          }}
          type="button"
        >
          Limpar
        </button>
        {options.map((option) => (
          <button
            className="min-h-8 px-3 text-left text-xs font-semibold text-foreground transition hover:bg-surface"
            key={option.value}
            onClick={() => {
              onChange(option.value);
              setOpen(false);
            }}
            type="button"
          >
            {option.label}
          </button>
        ))}
      </div>
    </Dropdown>
  );
}

export function UploadImportDialog({
  categories,
  error,
  onClose,
  onSubmit,
  pending,
  wallets,
}: {
  readonly categories: readonly Category[];
  readonly error?: string;
  readonly onClose: () => void;
  readonly onSubmit: (formData: FormData) => void;
  readonly pending: boolean;
  readonly wallets: readonly Wallet[];
}) {
  const formRef = useRef<HTMLFormElement | null>(null);
  const [fileName, setFileName] = useState("");
  const [source, setSource] = useState<ImportSource>("NUBANK_CSV");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!formRef.current) return;
    onSubmit(new FormData(formRef.current));
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-background/70 px-4 backdrop-blur-sm">
      <form
        className="w-[min(520px,calc(100vw-2rem))] overflow-hidden rounded-xl border border-border bg-surface-elevated shadow-2xl shadow-black/55"
        onSubmit={submit}
        ref={formRef}
      >
        <div className="flex items-start justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="text-sm font-bold">Nova importacao</h2>
            <p className="mt-1 text-xs text-muted">Selecione o CSV e os defaults de revisao.</p>
          </div>
          <button className={iconButtonClass} disabled={pending} onClick={onClose} type="button">
            <X className="size-3.5" />
          </button>
        </div>
        {error ? (
          <p className="border-b border-negative/20 bg-negative/10 px-5 py-3 text-xs text-negative">
            {error}
          </p>
        ) : null}
        <fieldset className="grid gap-4 px-5 py-4 disabled:cursor-wait disabled:opacity-60" disabled={pending}>
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border px-4 py-7 text-center transition hover:border-accent/60 hover:bg-surface">
            {fileName ? <FileText className="size-6 text-accent" /> : <Upload className="size-6 text-muted" />}
            <span className="text-xs font-semibold">{fileName || "Clique para selecionar o CSV"}</span>
            <span className="text-[10px] text-muted">CSV UTF-8, maximo 5 MB</span>
            <input
              accept=".csv"
              className="hidden"
              name="file"
              onChange={(event) => setFileName(event.target.files?.[0]?.name ?? "")}
              required
              type="file"
            />
          </label>
          <input name="source" type="hidden" value={source} />
          <div className="grid grid-cols-2 gap-2">
            {(["NUBANK_CSV", "NU_CONTA_CSV"] as const).map((option) => (
              <button
                className={`h-9 rounded-lg border text-xs font-semibold transition ${
                  source === option
                    ? "border-accent/60 bg-accent/10 text-accent"
                    : "border-border text-muted hover:bg-surface hover:text-foreground"
                }`}
                key={option}
                onClick={() => setSource(option)}
                type="button"
              >
                {importSourceLabels[option]}
              </button>
            ))}
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <LabeledSelect label="Carteira" name="defaultWalletId" options={wallets.map((wallet) => ({ label: wallet.name, value: wallet.id }))} />
            <LabeledSelect label="Categoria" name="defaultCategoryId" options={categories.map((category) => ({ label: category.name, value: category.id }))} />
            <LabeledSelect label="Natureza" name="nature" options={entryNatures.map((nature) => ({ label: entryNatureLabels[nature], value: nature }))} />
            <LabeledSelect label="Evento" name="economicEvent" options={economicEvents.map((event) => ({ label: economicEventLabels[event], value: event }))} />
          </div>
        </fieldset>
        {pending ? (
          <div aria-live="polite" className="flex items-center gap-2 border-t border-border bg-accent/5 px-5 py-3 text-xs font-medium text-accent">
            <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
            Enviando arquivo e preparando importacao...
          </div>
        ) : null}
        <div className="flex justify-end gap-2 border-t border-border px-5 py-4">
          <button className="h-9 rounded-lg border border-border px-4 text-xs font-semibold text-foreground" disabled={pending} onClick={onClose} type="button">
            Cancelar
          </button>
          <button className="flex h-9 items-center gap-2 rounded-lg bg-accent px-4 text-xs font-bold text-accent-foreground disabled:opacity-60" disabled={pending} type="submit">
            {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Upload className="size-3.5" />}
            {pending ? "Enviando..." : "Enviar"}
          </button>
        </div>
      </form>
    </div>
  );
}

function LabeledSelect({
  label,
  name,
  options,
}: {
  readonly label: string;
  readonly name: string;
  readonly options: readonly { label: string; value: string }[];
}) {
  return (
    <label className="grid gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted">
      {label}
      <select className={inputClass} name={name}>
        <option value="">Automatico</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  );
}

function InlineDropdown({
  disabled = false,
  emptyLabel,
  onChange,
  options,
  value,
}: {
  readonly disabled?: boolean;
  readonly emptyLabel: string;
  readonly onChange: (value: string | null) => void;
  readonly options: readonly { label: string; value: string }[];
  readonly value: string | null;
}) {
  const [open, setOpen] = useState(false);
  const typeaheadTextRef = useRef("");
  const typeaheadTimeoutRef = useRef<number | null>(null);
  const selected = options.find((option) => option.value === value);

  useEffect(() => {
    return () => {
      if (typeaheadTimeoutRef.current) {
        window.clearTimeout(typeaheadTimeoutRef.current);
      }
    };
  }, []);

  function handleTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (
      disabled ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.key.length !== 1
    ) {
      return;
    }

    event.preventDefault();

    if (typeaheadTimeoutRef.current) {
      window.clearTimeout(typeaheadTimeoutRef.current);
    }

    const nextSearchText = `${typeaheadTextRef.current}${event.key}`;
    typeaheadTextRef.current = nextSearchText;
    typeaheadTimeoutRef.current = window.setTimeout(() => {
      typeaheadTextRef.current = "";
    }, 800);

    const match = findInlineDropdownOption(options, nextSearchText);
    if (match) {
      onChange(match.value);
      setOpen(false);
    }
  }

  return (
    <Dropdown
      onOpenChange={setOpen}
      open={open}
      panelClassName="overflow-hidden rounded-lg border border-border bg-surface-elevated shadow-2xl shadow-black/45"
      trigger={({ open: dropdownOpen, triggerRef }) => (
        <button
          aria-expanded={dropdownOpen}
          className={`${inputClass} flex w-full items-center justify-between gap-2 text-left disabled:opacity-60`}
          disabled={disabled}
          onClick={() => setOpen((current) => !current)}
          onKeyDown={handleTriggerKeyDown}
          ref={(node) => {
            triggerRef.current = node;
          }}
          type="button"
        >
          <span className={selected ? "truncate" : "truncate text-muted"}>
            {selected?.label ?? emptyLabel}
          </span>
          <ChevronDown
            className={`size-3.5 shrink-0 text-muted transition ${
              dropdownOpen ? "rotate-180" : ""
            }`}
            aria-hidden="true"
          />
        </button>
      )}
      width="trigger"
    >
      <div className="grid py-1">
        <button
          className="min-h-8 px-3 text-left text-xs font-semibold text-muted transition hover:bg-surface hover:text-foreground"
          onClick={() => {
            onChange(null);
            setOpen(false);
          }}
          type="button"
        >
          {emptyLabel}
        </button>
        {options.map((option) => (
          <button
            className="min-h-8 px-3 text-left text-xs font-semibold text-foreground transition hover:bg-surface"
            key={option.value}
            onClick={() => {
              onChange(option.value);
              setOpen(false);
            }}
            type="button"
          >
            {option.label}
          </button>
        ))}
      </div>
    </Dropdown>
  );
}

function findInlineDropdownOption(
  options: readonly { label: string; value: string }[],
  searchText: string,
) {
  const normalizedSearch = normalizeTypeaheadText(searchText);
  if (!normalizedSearch) return null;

  return (
    options.find((option) =>
      normalizeTypeaheadText(option.label).startsWith(normalizedSearch),
    ) ?? null
  );
}

function normalizeTypeaheadText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function KpiCard({
  label,
  tone = "default",
  value,
}: {
  readonly label: string;
  readonly tone?: "default" | "positive" | "warning";
  readonly value: string;
}) {
  const className =
    tone === "positive"
      ? "border-positive/25 bg-positive/5 text-positive"
      : tone === "warning"
        ? "border-warning/25 bg-warning/5 text-warning"
        : "border-border bg-panel text-foreground";

  return (
    <div className={`rounded-lg border px-4 py-3 ${className}`}>
      <p className="mb-1.5 text-[10px] uppercase tracking-wider opacity-75">{label}</p>
      <p className="text-xl font-bold tabular-nums">{value}</p>
    </div>
  );
}

function StatusBadge({ label, tone = "default" }: { readonly label: string; readonly tone?: "default" | "positive" | "warning" }) {
  const className =
    tone === "positive"
      ? "bg-positive/10 text-positive"
      : tone === "warning"
        ? "bg-warning/10 text-warning"
        : "bg-surface text-muted";

  return <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${className}`}>{label}</span>;
}

const statusToneByRowStatus: Record<
  ImportRowViewStatus,
  "default" | "positive" | "warning"
> = {
  pending: "warning",
  ready: "positive",
  ignored: "default",
};

function savingFieldKey(rowId: string, field: ImportRowSavingField): string {
  return `${rowId}:${field}`;
}

function addSavingFields(
  current: ReadonlyMap<string, number>,
  rowId: string,
  fields: readonly ImportRowSavingField[],
): ReadonlyMap<string, number> {
  const next = new Map(current);

  for (const field of fields) {
    const key = savingFieldKey(rowId, field);
    next.set(key, (next.get(key) ?? 0) + 1);
  }

  return next;
}

function removeSavingFields(
  current: ReadonlyMap<string, number>,
  rowId: string,
  fields: readonly ImportRowSavingField[],
): ReadonlyMap<string, number> {
  const next = new Map(current);

  for (const field of fields) {
    const key = savingFieldKey(rowId, field);
    const count = (next.get(key) ?? 1) - 1;
    if (count <= 0) next.delete(key);
    else next.set(key, count);
  }

  return next;
}

function SkeletonBlock() {
  return (
    <div className="h-14 animate-pulse rounded-lg border border-border bg-surface" />
  );
}

function getSavingFieldsFromPatch(
  patch: ImportRowOptimisticPatch,
): readonly ImportRowSavingField[] {
  const fields: ImportRowSavingField[] = [];

  if ("amountCents" in patch) fields.push("amountCents");
  if ("categoryId" in patch) fields.push("categoryId");
  if ("description" in patch) fields.push("description");
  if ("economicEvent" in patch) fields.push("economicEvent");
  if ("nature" in patch) fields.push("nature");
  if ("occurredOn" in patch) fields.push("occurredOn");
  if ("walletId" in patch) fields.push("walletId");

  return fields;
}

function summarizeRows(rows: readonly ImportRow[]) {
  return rows.reduce(
    (totals, row) => {
      if (row.entryId) totals.confirmed += 1;
      else if (row.ignoredAt) totals.ignored += 1;
      else totals.active += 1;
      return totals;
    },
    { active: 0, confirmed: 0, ignored: 0 },
  );
}

function rowToPatchBody(row: ImportRow, patch: Partial<RowPatch>): RowPatch {
  return {
    description: patch.description ?? row.description ?? "",
    occurredOn: patch.occurredOn ?? row.occurredOn,
    amountCents: patch.amountCents ?? row.amountCents,
    walletId: patch.walletId === undefined ? row.walletId : patch.walletId,
    categoryId:
      patch.categoryId === undefined ? row.categoryId : patch.categoryId,
    nature: patch.nature === undefined ? row.nature : patch.nature,
    economicEvent:
      patch.economicEvent === undefined
        ? row.economicEvent
        : patch.economicEvent,
  };
}

async function sendImportJson(
  url: string,
  body: unknown,
  method: "PUT" | "PATCH" | "DELETE",
): Promise<{ ok: boolean; body: ImportApiResponse }> {
  const response = await fetch(url, {
    method,
    ...(body === undefined
      ? {}
      : {
          body: JSON.stringify(body),
          headers: { "Content-Type": "application/json" },
        }),
  });

  return { ok: response.ok, body: (await response.json()) as ImportApiResponse };
}

function importAttachmentUrl(target: ImportAttachmentTarget): string {
  return target.importRowId
    ? `/api/imports/${target.importRequestId}/rows/${target.importRowId}/attachments`
    : `/api/imports/${target.importRequestId}/attachments`;
}

function formatDateTime(value: Date | string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const iconButtonClass =
  "flex size-8 shrink-0 items-center justify-center rounded-md text-muted transition hover:bg-surface hover:text-foreground disabled:opacity-50";
const inputClass =
  "h-9 rounded-lg border border-border bg-surface/70 px-2.5 text-xs text-foreground outline-none focus:ring-1 focus:ring-accent";
