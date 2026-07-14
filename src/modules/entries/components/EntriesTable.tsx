"use client";

import {
  FormEvent,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import {
  AlertTriangle,
  ArrowLeftRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Check,
  FileText,
  Link2Off,
  Loader2,
  Paperclip,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import type { Category } from "@/domain/category/category";
import type {
  EconomicEvent,
  Entry,
  EntryNature,
} from "@/domain/entry/entry";
import {
  economicEventLabels,
  economicEvents,
  entryNatureLabels,
  entryNatures,
} from "@/domain/entry/entry";
import type { Wallet } from "@/domain/wallet/wallet";
import {
  SystemToast,
  type SystemToastMessage,
} from "@/components/ui/system-toast";
import {
  PeriodFilter,
  type PeriodFilterRange,
} from "@/components/ui/PeriodFilter";
import { FilterSelect } from "@/components/ui/FilterSelect";
import { Dropdown } from "@/components/ui/Dropdown";
import { CurrencyField } from "@/components/ui/CurrencyField";
import { CalendarField } from "@/components/ui/CalendarField";
import { CategorySelect } from "@/components/domain/CategorySelect";
import { CategoryBadge } from "@/modules/categories/components/CategoryBadge";
import { EntriesMobileList } from "@/modules/entries/components/EntriesMobileList";
import { TransactionImportButton } from "@/modules/entries/components/TransactionImportButton";
import type { EntryForm } from "@/modules/entries/view-models/entry-form";

export type EntriesTableMode = "transactions" | "wallet";

type EntriesTableProps = {
  readonly initialEntries: readonly Entry[];
  readonly wallets: readonly Wallet[];
  readonly categories: readonly Category[];
  readonly initialStartDate: string;
  readonly initialEndDate: string;
  readonly initialToastMessage?: string;
  readonly mode?: EntriesTableMode;
  readonly onEntriesChanged?: () => void;
  readonly transferEntries?: readonly Entry[];
  readonly walletId?: string;
};

type EntryApiResponse = {
  readonly status?: string;
  readonly entry?: Entry;
  readonly entries?: Entry[];
  readonly error?: string;
};

type EntryAttachmentView = {
  readonly id: string;
  readonly entryId: string;
  readonly originalFileName: string;
  readonly mimeType: string;
  readonly sizeBytes: number;
  readonly signedUrl: string;
  readonly createdAt: Date | string;
};

type EntryAttachmentApiResponse = {
  readonly attachment?: EntryAttachmentView;
  readonly attachments?: EntryAttachmentView[];
  readonly error?: string;
};

const statusMessages: Record<string, string> = {
  created: "Lancamento criado com sucesso",
  updated: "Lancamento atualizado com sucesso",
  deleted: "Lancamento excluido com sucesso",
  restored: "Lancamento restaurado com sucesso",
  linked: "Transferencia vinculada com sucesso",
  unlinked: "Transferencia desvinculada com sucesso",
};

export function EntriesTable({
  categories,
  initialEndDate,
  initialEntries,
  initialStartDate,
  initialToastMessage,
  mode = "transactions",
  onEntriesChanged,
  transferEntries,
  walletId,
  wallets,
}: EntriesTableProps) {
  const [entries, setEntries] = useState(() => [...initialEntries]);
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);
  const [walletFilters, setWalletFilters] = useState<string[]>([]);
  const [categoryFilters, setCategoryFilters] = useState<string[]>([]);
  const [natureFilters, setNatureFilters] = useState<EntryNature[]>([]);
  const [eventFilters, setEventFilters] = useState<EconomicEvent[]>([]);
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [savingRow, setSavingRow] = useState<"add" | string | null>(null);
  const [errorRow, setErrorRow] = useState<"add" | string | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<Entry | null>(null);
  const [transferSource, setTransferSource] = useState<Entry | null>(null);
  const [unlinkCandidate, setUnlinkCandidate] = useState<Entry | null>(null);
  const [attachmentEntry, setAttachmentEntry] = useState<Entry | null>(null);
  const [attachments, setAttachments] = useState<EntryAttachmentView[]>([]);
  const [attachmentsLoading, setAttachmentsLoading] = useState(false);
  const [attachmentUploading, setAttachmentUploading] = useState(false);
  const [transferMode, setTransferMode] = useState<"existing" | "create">(
    "existing",
  );
  const [targetEntryId, setTargetEntryId] = useState("");
  const [transferForm, setTransferForm] = useState<EntryForm>(() =>
    defaultTransferForm(wallets, categories),
  );
  const [transferSaving, setTransferSaving] = useState(false);
  const [form, setForm] = useState<EntryForm>(() =>
    defaultForm(wallets, categories),
  );
  const [toast, setToast] = useState<SystemToastMessage | null>(() =>
    initialToastMessage
      ? { id: Date.now(), message: initialToastMessage, tone: "success" }
      : null,
  );
  const [pending, startTransition] = useTransition();
  const addButtonRef = useRef<HTMLButtonElement | null>(null);
  const filtersInitializedRef = useRef(false);
  const walletListMode = mode === "wallet";

  useEffect(() => {
    setEntries([...initialEntries]);
  }, [initialEntries]);

  const categoriesById = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories],
  );
  const totals = useMemo(
    () =>
      entries
        .filter((entry) => !entry.deletedAt)
        .reduce(
          (sum, entry) => {
            if (entry.direction === "IN") {
              sum.incomeCents += entry.amountCents;
            } else {
              sum.expenseCents += entry.amountCents;
            }

            sum.count += 1;
            sum.netCents = sum.incomeCents - sum.expenseCents;
            return sum;
          },
          { count: 0, incomeCents: 0, expenseCents: 0, netCents: 0 },
        ),
    [entries],
  );

  function showToast(tone: "success" | "error", message: string) {
    setToast({ id: Date.now(), message, tone });
  }

  function notifyEntriesChanged() {
    onEntriesChanged?.();
  }

  function entriesInScope(items: readonly Entry[]): Entry[] {
    return walletId
      ? items.filter((entry) => entry.walletId === walletId)
      : [...items];
  }

  function successMessage(status: string | undefined) {
    return status ? statusMessages[status] ?? "Operacao concluida" : "Operacao concluida";
  }

  const refreshEntries = useCallback(async () => {
    const params = new URLSearchParams();
    params.set("startDate", startDate);
    params.set("endDate", endDate);
    params.set("includeDeleted", String(includeDeleted));

    walletFilters.forEach((walletId) => params.append("walletIds", walletId));
    categoryFilters.forEach((categoryId) =>
      params.append("categoryIds", categoryId),
    );
    natureFilters.forEach((nature) => params.append("natures", nature));
    eventFilters.forEach((event) => params.append("economicEvents", event));

    const response = await fetch(`/api/entries?${params.toString()}`);
    const body = (await response.json()) as EntryApiResponse;

    if (!response.ok) {
      showToast("error", body.error ?? "Nao foi possivel carregar lancamentos");
      return;
    }

    setEntries(body.entries ?? []);
  }, [
    categoryFilters,
    endDate,
    eventFilters,
    includeDeleted,
    natureFilters,
    startDate,
    walletFilters,
  ]);

  useEffect(() => {
    if (!filtersInitializedRef.current) {
      filtersInitializedRef.current = true;
      return;
    }

    startTransition(() => void refreshEntries());
  }, [refreshEntries]);

  function changePeriod(range: PeriodFilterRange) {
    setStartDate(range.startDate);
    setEndDate(range.endDate);
  }

  function startAdd() {
    setEditingId(null);
    setSavingRow(null);
    setErrorRow(null);
    setAdding(true);
    setForm(defaultForm(wallets, categories));
  }

  function startEdit(entry: Entry) {
    setAdding(false);
    setSavingRow(null);
    setErrorRow(null);
    setEditingId(entry.id);
    setForm({
      walletId: entry.walletId,
      categoryId: entry.categoryId ?? "",
      nature: entry.nature,
      economicEvent: entry.economicEvent ?? "",
      amountCents: entry.amountCents,
      occurredOn: entry.occurredOn,
      description: entry.description ?? "",
    });
  }

  function cancelForm() {
    setAdding(false);
    setEditingId(null);
    setSavingRow(null);
    setErrorRow(null);
    setTimeout(() => addButtonRef.current?.focus(), 0);
  }

  async function saveAdd(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    setErrorRow(null);
    setSavingRow("add");

    const skeletonDelay = wait(650);
    const response = await sendEntryJson("/api/entries", requestFromForm(form));
    await skeletonDelay;

    if (!response.ok) {
      setSavingRow(null);
      setErrorRow("add");
      showToast("error", response.body.error ?? "Nao foi possivel salvar");
      return;
    }

    if (response.body.entry) {
      setEntries((current) =>
        entriesInScope([response.body.entry as Entry, ...current]),
      );
    }

    notifyEntriesChanged();

    setAdding(false);
    setSavingRow(null);
    setErrorRow(null);
    showToast("success", successMessage(response.body.status));
  }

  async function saveEdit(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();

    if (!editingId) {
      return;
    }

    setErrorRow(null);
    setSavingRow(editingId);

    const skeletonDelay = wait(650);
    const response = await sendEntryJson(
      `/api/entries/${editingId}`,
      requestFromForm(form),
      "PUT",
    );
    await skeletonDelay;

    if (!response.ok) {
      setSavingRow(null);
      setErrorRow(editingId);
      showToast("error", response.body.error ?? "Nao foi possivel salvar");
      return;
    }

    if (response.body.entry) {
      setEntries((current) =>
        entriesInScope(
          current.map((entry) =>
            entry.id === editingId ? (response.body.entry as Entry) : entry,
          ),
        ),
      );
    }

    notifyEntriesChanged();

    setEditingId(null);
    setSavingRow(null);
    setErrorRow(null);
    showToast("success", successMessage(response.body.status));
  }

  async function softDelete(entry: Entry) {
    const response = await sendEntryJson(`/api/entries/${entry.id}`, null, "DELETE");

    if (!response.ok) {
      showToast("error", response.body.error ?? "Nao foi possivel excluir");
      return;
    }

    if (includeDeleted && response.body.entry) {
      setEntries((current) =>
        current.map((item) =>
          item.id === entry.id ? (response.body.entry as Entry) : item,
        ),
      );
    } else {
      setEntries((current) => current.filter((item) => item.id !== entry.id));
    }

    notifyEntriesChanged();
    showToast("success", successMessage(response.body.status));
    setDeleteCandidate(null);
  }

  async function restore(entry: Entry) {
    const response = await sendEntryJson(
      `/api/entries/${entry.id}`,
      { restore: true },
      "PATCH",
    );

    if (!response.ok) {
      showToast("error", response.body.error ?? "Nao foi possivel restaurar");
      return;
    }

    if (response.body.entry) {
      setEntries((current) =>
        current.map((item) =>
          item.id === entry.id ? (response.body.entry as Entry) : item,
        ),
      );
    }

    notifyEntriesChanged();
    showToast("success", successMessage(response.body.status));
  }

  function startTransfer(entry: Entry) {
    if (entry.transferId) {
      setUnlinkCandidate(entry);
      return;
    }

    const candidates = transferCandidates(transferEntries ?? entries, entry);

    setTransferSource(entry);
    setTransferMode(candidates.length > 0 ? "existing" : "create");
    setTargetEntryId(candidates[0]?.id ?? "");
    setTransferForm(defaultTransferForm(wallets, categories, entry));
  }

  async function linkTransfer(source: Entry) {
    setTransferSaving(true);
    const body =
      transferMode === "existing"
        ? { mode: "existing", targetEntryId }
        : {
            mode: "create",
            walletId: transferForm.walletId,
            categoryId: transferForm.categoryId,
            nature: transferForm.nature,
            description: transferForm.description,
          };
    try {
      const response = await sendEntryJson(
        `/api/entries/${source.id}/transfer`,
        body,
      );

      if (!response.ok) {
        showToast(
          "error",
          response.body.error ?? "Nao foi possivel vincular transferencia",
        );
        return;
      }

      setTransferSource(null);
      setEntries((current) =>
        entriesInScope(mergeEntries(current, response.body.entries ?? [])),
      );
      notifyEntriesChanged();
      showToast("success", successMessage(response.body.status));
    } finally {
      setTransferSaving(false);
    }
  }

  async function unlinkTransfer(source: Entry) {
    setTransferSaving(true);

    try {
      const response = await sendEntryJson(
        `/api/entries/${source.id}/transfer`,
        null,
        "DELETE",
      );

      if (!response.ok) {
        showToast(
          "error",
          response.body.error ?? "Nao foi possivel desvincular transferencia",
        );
        return;
      }

      setUnlinkCandidate(null);
      setEntries((current) =>
        entriesInScope(mergeEntries(current, response.body.entries ?? [])),
      );
      notifyEntriesChanged();
      showToast("success", successMessage(response.body.status));
    } finally {
      setTransferSaving(false);
    }
  }

  async function openAttachments(entry: Entry) {
    setAttachmentEntry(entry);
    setAttachments([]);
    setAttachmentsLoading(true);

    try {
      const response = await fetch(`/api/entries/${entry.id}/attachments`);
      const body = (await response.json()) as EntryAttachmentApiResponse;

      if (!response.ok) {
        showToast("error", body.error ?? "Nao foi possivel carregar anexos");
        return;
      }

      setAttachments(body.attachments ?? []);
    } catch {
      showToast("error", "Nao foi possivel carregar anexos");
    } finally {
      setAttachmentsLoading(false);
    }
  }

  async function uploadAttachment(formData: FormData): Promise<boolean> {
    if (!attachmentEntry) return false;

    setAttachmentUploading(true);

    try {
      const response = await fetch(
        `/api/entries/${attachmentEntry.id}/attachments`,
        {
          method: "POST",
          body: formData,
        },
      );
      const body = (await response.json()) as EntryAttachmentApiResponse;

      if (!response.ok || !body.attachment) {
        showToast("error", body.error ?? "Nao foi possivel enviar anexo");
        return false;
      }

      setAttachments((current) => [body.attachment as EntryAttachmentView, ...current]);
      setEntries((current) =>
        current.map((entry) =>
          entry.id === attachmentEntry.id
            ? {
                ...entry,
                attachmentCount: (entry.attachmentCount ?? 0) + 1,
              }
            : entry,
        ),
      );
      showToast("success", "Anexo enviado com sucesso");
      setAttachmentEntry(null);
      return true;
    } catch {
      showToast("error", "Nao foi possivel enviar anexo");
      return false;
    } finally {
      setAttachmentUploading(false);
    }
  }

  return (
    <div className="flex w-full flex-col gap-4 lg:gap-6">
      {toast ? <SystemToast onDismiss={() => setToast(null)} toast={toast} /> : null}
      {deleteCandidate ? (
        <DeleteEntryDialog
          entry={deleteCandidate}
          onCancel={() => setDeleteCandidate(null)}
          onConfirm={() =>
            startTransition(() => void softDelete(deleteCandidate))
          }
          pending={pending || transferSaving}
        />
      ) : null}
      {transferSource ? (
        <LinkTransferDialog
          categories={categories}
          entries={transferEntries ?? entries}
          form={transferForm}
          mode={transferMode}
          onCancel={() => setTransferSource(null)}
          onChangeForm={setTransferForm}
          onChangeMode={setTransferMode}
          onChangeTargetEntryId={setTargetEntryId}
          onConfirm={() => void linkTransfer(transferSource)}
          pending={pending || transferSaving}
          source={transferSource}
          targetEntryId={targetEntryId}
          wallets={wallets}
        />
      ) : null}
      {unlinkCandidate ? (
        <UnlinkTransferDialog
          entry={unlinkCandidate}
          onCancel={() => setUnlinkCandidate(null)}
          onConfirm={() => void unlinkTransfer(unlinkCandidate)}
          pending={pending || transferSaving}
        />
      ) : null}
      {attachmentEntry ? (
        <EntryAttachmentsDialog
          attachments={attachments}
          entry={attachmentEntry}
          loading={attachmentsLoading}
          onClose={() => setAttachmentEntry(null)}
          onSubmit={uploadAttachment}
          uploading={attachmentUploading}
        />
      ) : null}

      {!walletListMode ? (
      <div className="flex flex-wrap items-end gap-2">
        <PeriodFilter
          initialEndDate={initialEndDate}
          initialPreset="current-month"
          initialStartDate={initialStartDate}
          onChange={changePeriod}
        />
        <FilterSelect
          label="Carteira"
          onChange={setWalletFilters}
          options={wallets.map((wallet) => ({
            value: wallet.id,
            label: wallet.name,
          }))}
          selectedValues={walletFilters}
        />
        <CategorySelect
          categories={categories}
          onChange={setCategoryFilters}
          selectedValues={categoryFilters}
        />
        <FilterSelect
          label="Natureza"
          onChange={setNatureFilters}
          options={entryNatures.map((nature) => ({
            value: nature,
            label: entryNatureLabels[nature],
          }))}
          selectedValues={natureFilters}
        />
        <FilterSelect
          label="Evento"
          onChange={setEventFilters}
          options={economicEvents.map((event) => ({
            value: event,
            label: economicEventLabels[event],
          }))}
          selectedValues={eventFilters}
        />
        <FilterSwitch
          active={includeDeleted}
          label="Excluidos"
          onToggle={() => setIncludeDeleted((current) => !current)}
        />
        <div className="flex-1" />
        <button
          className="flex h-8 items-center gap-1.5 rounded-lg bg-accent px-3 text-xs font-semibold text-accent-foreground transition hover:bg-accent/90"
          onClick={startAdd}
          type="button"
        >
          <Plus className="size-3.5" aria-hidden="true" />
          Adicionar
        </button>
        <TransactionImportButton categories={categories} wallets={wallets} />
      </div>
      ) : null}

      {!walletListMode ? (
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Transacoes" value={String(totals.count)} />
        <KpiCard label="Receitas" tone="positive" value={formatMoney(totals.incomeCents)} />
        <KpiCard label="Despesas" tone="negative" value={formatMoney(-totals.expenseCents)} />
        <KpiCard
          label="Liquido"
          tone={totals.netCents >= 0 ? "positive" : "negative"}
          value={`${totals.netCents >= 0 ? "+" : ""}${formatMoney(totals.netCents)}`}
        />
      </div>
      ) : null}

      <EntriesMobileList
        adding={adding}
        allowCreate={!walletListMode}
        categories={categories}
        editingId={editingId}
        entries={entries}
        errorRow={errorRow}
        form={form}
        onAttachments={(entry) => void openAttachments(entry)}
        onCancel={cancelForm}
        onChangeForm={setForm}
        onDelete={setDeleteCandidate}
        onEdit={startEdit}
        onRestore={(entry) => startTransition(() => void restore(entry))}
        onSaveAdd={(event) => startTransition(() => void saveAdd(event))}
        onSaveEdit={(event) => startTransition(() => void saveEdit(event))}
        onStartAdd={startAdd}
        onTransfer={startTransfer}
        pending={pending}
        savingRow={savingRow}
        wallets={wallets}
      />

      <div className="hidden overflow-hidden rounded-xl border border-border md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-xs">
            <thead>
              <tr className="border-b border-border bg-panel">
                {[
                  "Ocorrido em",
                  "Categoria",
                  "Descricao",
                  "Carteira",
                  "Natureza",
                  "Evento economico",
                  "Valor",
                  "",
                ].map((heading) => (
                  <th
                    className={`px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted ${
                      heading === "Valor" ? "text-right" : "text-left"
                    }`}
                    key={heading}
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-panel">
              {entries.length === 0 && !adding ? (
                <tr>
                  <td className="px-4 py-8 text-center text-xs italic text-muted" colSpan={8}>
                    Nenhuma transacao encontrada.
                  </td>
                </tr>
              ) : null}

              {entries.map((entry) =>
                editingId === entry.id ? (
                  savingRow === entry.id ? (
                    <EntrySkeletonRow key={entry.id} />
                  ) : (
                    <EntryFormRow
                      categories={categories}
                      form={form}
                      key={entry.id}
                      onCancel={cancelForm}
                      onChange={setForm}
                      onSave={(event) =>
                        startTransition(() => void saveEdit(event))
                      }
                      pending={pending}
                      hasError={errorRow === entry.id}
                      wallets={wallets}
                    />
                  )
                ) : (
                  <EntryDisplayRow
                    category={entry.categoryId ? categoriesById.get(entry.categoryId) : undefined}
                    entry={entry}
                    key={entry.id}
                    onDelete={() => setDeleteCandidate(entry)}
                    onEdit={() => startEdit(entry)}
                    onAttachments={() => void openAttachments(entry)}
                    onRestore={() => startTransition(() => void restore(entry))}
                    onTransfer={() => startTransfer(entry)}
                    pending={pending}
                  />
                ),
              )}

              {adding ? (
                savingRow === "add" ? (
                  <EntrySkeletonRow />
                ) : (
                  <EntryFormRow
                    categories={categories}
                    form={form}
                    onCancel={cancelForm}
                    onChange={setForm}
                    onSave={(event) =>
                      startTransition(() => void saveAdd(event))
                    }
                    pending={pending}
                    hasError={errorRow === "add"}
                    wallets={wallets}
                  />
                )
              ) : null}
            </tbody>
          </table>
        </div>

        {!adding && !walletListMode ? (
          <button
            className="flex w-full items-center justify-center gap-1.5 border-t border-dashed border-border py-3 text-xs font-medium text-muted transition hover:bg-surface-elevated/60 hover:text-foreground focus:outline-none focus-visible:ring-1 focus-visible:ring-accent"
            onClick={startAdd}
            ref={addButtonRef}
            type="button"
          >
            <Plus className="size-3.5" aria-hidden="true" />
            Adicionar transacao
          </button>
        ) : null}
      </div>
    </div>
  );
}

function EntryDisplayRow({
  category,
  entry,
  onDelete,
  onEdit,
  onAttachments,
  onRestore,
  onTransfer,
  pending,
}: {
  readonly category?: Category;
  readonly entry: Entry;
  readonly onDelete: () => void;
  readonly onEdit: () => void;
  readonly onAttachments: () => void;
  readonly onRestore: () => void;
  readonly onTransfer: () => void;
  readonly pending: boolean;
}) {
  const deleted = Boolean(entry.deletedAt);
  const signedAmount = entry.direction === "OUT" ? -entry.amountCents : entry.amountCents;

  return (
    <tr className={`group transition hover:bg-surface-elevated/50 ${deleted ? "opacity-45" : ""}`}>
      <td className="px-4 py-3 text-muted tabular-nums whitespace-nowrap">{formatDate(entry.occurredOn)}</td>
      <td className="px-4 py-3">
        {category ? (
          <CategoryBadge color={category.color} icon={category.icon} name={category.name} />
        ) : (
          <span className="text-muted">{entry.categoryName ?? "Sem categoria"}</span>
        )}
      </td>
      <td className="max-w-[220px] px-4 py-3 text-foreground">
        <span className={`block truncate ${deleted ? "line-through" : ""}`}>
          {entry.description || "Sem descricao"}
        </span>
      </td>
      <td className="px-4 py-3 text-muted whitespace-nowrap">{entry.walletName ?? entry.walletId}</td>
      <td className="px-4 py-3">
        <Tag tone={entry.nature === "OPERATIONAL" ? "accent" : "asset"}>
          {entryNatureLabels[entry.nature]}
        </Tag>
      </td>
      <td className="px-4 py-3">
        {entry.economicEvent ? (
          <Tag>{economicEventLabels[entry.economicEvent]}</Tag>
        ) : (
          <span className="text-muted">-</span>
        )}
      </td>
      <td className={`px-4 py-3 text-right font-semibold tabular-nums whitespace-nowrap ${signedAmount < 0 ? "text-negative" : "text-positive"}`}>
        {signedAmount >= 0 ? "+" : ""}
        {formatMoney(signedAmount)}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1">
          <TransferIndicator
            disabled={pending}
            linked={Boolean(entry.transferId)}
            onClick={onTransfer}
          />
          <AttachmentIndicator
            count={entry.attachmentCount ?? 0}
            disabled={pending}
            onClick={onAttachments}
          />
          {deleted ? (
            <div className="opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
              <IconButton disabled={pending} label="Restaurar lancamento" onClick={onRestore} tone="positive">
                <RotateCcw className="size-3.5" aria-hidden="true" />
              </IconButton>
            </div>
          ) : (
            <div className="flex items-center gap-1 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
              <IconButton label="Editar lancamento" onClick={onEdit} tone="muted">
                <Pencil className="size-3.5" aria-hidden="true" />
              </IconButton>
              <IconButton disabled={pending} label="Excluir lancamento" onClick={onDelete} tone="negative">
                <Trash2 className="size-3.5" aria-hidden="true" />
              </IconButton>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}

function AttachmentIndicator({
  count,
  disabled,
  onClick,
}: {
  readonly count: number;
  readonly disabled: boolean;
  readonly onClick: () => void;
}) {
  const hasAttachments = count > 0;
  const className = hasAttachments
    ? "bg-positive/15 text-positive hover:bg-positive/25 disabled:opacity-40"
    : "text-muted opacity-0 hover:bg-accent/10 hover:text-accent group-hover:opacity-100 disabled:opacity-40";

  return (
    <button
      className={`relative flex size-7 shrink-0 items-center justify-center rounded-md transition ${className}`}
      disabled={disabled}
      onClick={onClick}
      title={hasAttachments ? `${count} anexo(s)` : "Adicionar anexo"}
      type="button"
    >
      <Paperclip className="size-3.5" aria-hidden="true" />
      {hasAttachments ? (
        <span className="absolute -right-1 -top-1 flex size-3.5 items-center justify-center rounded-full bg-positive text-[9px] font-bold text-background">
          {count > 9 ? "9+" : count}
        </span>
      ) : null}
      <span className="sr-only">
        {hasAttachments ? `${count} anexo(s)` : "Adicionar anexo"}
      </span>
    </button>
  );
}

function TransferIndicator({
  disabled,
  linked,
  onClick,
}: {
  readonly disabled: boolean;
  readonly linked: boolean;
  readonly onClick: () => void;
}) {
  if (!linked) {
    return (
      <button
        className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted opacity-0 transition hover:bg-accent/10 hover:text-accent group-hover:opacity-100 disabled:opacity-40"
        disabled={disabled}
        onClick={onClick}
        title="Vincular transferencia"
        type="button"
      >
        <ArrowLeftRight className="size-3.5" aria-hidden="true" />
        <span className="sr-only">Vincular transferencia</span>
      </button>
    );
  }

  return (
    <button
      className="flex size-7 shrink-0 items-center justify-center rounded-md bg-accent/10 text-accent transition hover:bg-warning/15 hover:text-warning disabled:opacity-40"
      disabled={disabled}
      onClick={onClick}
      title="Desvincular transferencia"
      type="button"
    >
      <ArrowLeftRight className="size-3.5" aria-hidden="true" />
      <span className="sr-only">Desvincular transferencia</span>
    </button>
  );
}

function EntryAttachmentsDialog({
  attachments,
  entry,
  loading,
  onClose,
  onSubmit,
  uploading,
}: {
  readonly attachments: readonly EntryAttachmentView[];
  readonly entry: Entry;
  readonly loading: boolean;
  readonly onClose: () => void;
  readonly onSubmit: (formData: FormData) => Promise<boolean>;
  readonly uploading: boolean;
}) {
  const formRef = useRef<HTMLFormElement | null>(null);
  const [fileName, setFileName] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!formRef.current || uploading) return;

    const uploaded = await onSubmit(new FormData(formRef.current));

    if (uploaded) {
      formRef.current.reset();
      setFileName("");
    }
  }

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-background/70 px-4 backdrop-blur-sm"
      role="presentation"
    >
      <div
        aria-modal="true"
        className="flex max-h-[calc(100vh-2rem)] w-[min(560px,calc(100vw-2rem))] flex-col overflow-hidden rounded-xl border border-border bg-surface-elevated shadow-2xl shadow-black/55"
        role="dialog"
      >
        <div className="flex shrink-0 items-start justify-between border-b border-border px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-foreground">Anexos da transacao</h2>
            <p className="mt-1 truncate text-xs text-muted">{entryLabel(entry)}</p>
          </div>
          <button className={iconButtonClass} onClick={onClose} type="button">
            <X className="size-3.5" aria-hidden="true" />
          </button>
        </div>

        <form
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={submit}
          ref={formRef}
        >
          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="grid gap-4 px-5 py-4">
              <label
                aria-busy={uploading}
                className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border px-4 py-7 text-center transition ${
                  uploading
                    ? "cursor-wait bg-surface opacity-75"
                    : "cursor-pointer hover:border-accent/60 hover:bg-surface"
                }`}
              >
                {uploading ? (
                  <Loader2
                    className="size-6 animate-spin text-accent"
                    aria-hidden="true"
                  />
                ) : fileName ? (
                  <FileText className="size-6 text-accent" aria-hidden="true" />
                ) : (
                  <Upload className="size-6 text-muted" aria-hidden="true" />
                )}
                <span className="text-xs font-semibold">
                  {uploading
                    ? "Enviando documento..."
                    : fileName || "Clique para selecionar um documento"}
                </span>
                <span className="text-[10px] text-muted">
                  {uploading ? "Aguarde a conclusao do envio" : "PDF, JPG, PNG ou WebP, maximo 10 MB"}
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
                  <div className="grid gap-3 sm:grid-cols-2">
                    <SkeletonBlock />
                    <SkeletonBlock />
                  </div>
                </div>
              ) : attachments.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {attachments.map((attachment) => (
                    <AttachmentCard attachment={attachment} key={attachment.id} />
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

function AttachmentCard({
  attachment,
}: {
  readonly attachment: EntryAttachmentView;
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
          <FileText className="size-8 text-muted" aria-hidden="true" />
        )}
      </div>
      <div className="grid gap-1 px-3 py-2">
        <span className="truncate text-xs font-semibold text-foreground">
          {attachment.originalFileName}
        </span>
        <span className="text-[10px] text-muted">
          {formatFileSize(attachment.sizeBytes)} - {formatDateTime(attachment.createdAt)}
        </span>
      </div>
    </a>
  );
}

function LinkTransferDialog({
  categories,
  entries,
  form,
  mode,
  onCancel,
  onChangeForm,
  onChangeMode,
  onChangeTargetEntryId,
  onConfirm,
  pending,
  source,
  targetEntryId,
  wallets,
}: {
  readonly categories: readonly Category[];
  readonly entries: readonly Entry[];
  readonly form: EntryForm;
  readonly mode: "existing" | "create";
  readonly onCancel: () => void;
  readonly onChangeForm: (form: EntryForm) => void;
  readonly onChangeMode: (mode: "existing" | "create") => void;
  readonly onChangeTargetEntryId: (entryId: string) => void;
  readonly onConfirm: () => void;
  readonly pending: boolean;
  readonly source: Entry;
  readonly targetEntryId: string;
  readonly wallets: readonly Wallet[];
}) {
  const candidates = transferCandidates(entries, source);
  const [candidatePage, setCandidatePage] = useState(0);
  const targetCategoryType = source.direction === "OUT" ? "INCOME" : "EXPENSE";
  const targetCategories = categories.filter(
    (category) => category.type === targetCategoryType,
  );
  const targetWallets = wallets.filter((wallet) => wallet.id !== source.walletId);
  const candidatePageSize = 5;
  const candidatePageCount = Math.max(
    1,
    Math.ceil(candidates.length / candidatePageSize),
  );
  const normalizedCandidatePage = Math.min(candidatePage, candidatePageCount - 1);
  const pagedCandidates = candidates.slice(
    normalizedCandidatePage * candidatePageSize,
    normalizedCandidatePage * candidatePageSize + candidatePageSize,
  );
  const confirmDisabled =
    pending ||
    (mode === "existing" ? !targetEntryId : !form.walletId || !form.categoryId);

  useEffect(() => {
    setCandidatePage(0);
  }, [source.id, mode]);

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-background/70 px-4 backdrop-blur-sm"
      role="presentation"
    >
      <div
        aria-modal="true"
        className="w-[min(560px,calc(100vw-2rem))] rounded-xl border border-border bg-surface-elevated p-5 shadow-2xl shadow-black/55"
        role="dialog"
      >
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
            <ArrowLeftRight className="size-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-foreground">Vincular transferencia</h2>
            <p className="mt-1 text-xs text-muted">
              {entryLabel(source)} - {formatMoney(source.amountCents)}
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 rounded-lg border border-border bg-panel p-1">
          <button
            aria-pressed={mode === "existing"}
            className={`h-8 rounded-md text-xs font-semibold transition ${
              mode === "existing"
                ? "bg-accent text-accent-foreground"
                : "text-muted hover:text-foreground"
            }`}
            disabled={pending}
            onClick={() => onChangeMode("existing")}
            type="button"
          >
            Vincular existente
          </button>
          <button
            aria-pressed={mode === "create"}
            className={`h-8 rounded-md text-xs font-semibold transition ${
              mode === "create"
                ? "bg-accent text-accent-foreground"
                : "text-muted hover:text-foreground"
            }`}
            disabled={pending}
            onClick={() => onChangeMode("create")}
            type="button"
          >
            Criar novo registro
          </button>
        </div>

        {mode === "existing" ? (
          <div className="mt-4">
            <div className="overflow-hidden rounded-lg border border-border">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[500px] text-xs">
                  <thead>
                    <tr className="border-b border-border bg-panel">
                      {["", "Data", "Carteira", "Descricao", "Valor"].map(
                        (heading) => (
                          <th
                            className={`px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted ${
                              heading === "Valor" ? "text-right" : "text-left"
                            }`}
                            key={heading}
                          >
                            {heading}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-surface">
                    {pagedCandidates.map((entry) => {
                      const selected = entry.id === targetEntryId;
                      const signedAmount =
                        entry.direction === "OUT"
                          ? -entry.amountCents
                          : entry.amountCents;

                      return (
                        <tr
                          className={`cursor-pointer transition hover:bg-surface-elevated ${
                            selected ? "bg-accent/10" : ""
                          } ${pending ? "pointer-events-none opacity-60" : ""}`}
                          key={entry.id}
                          onClick={() => onChangeTargetEntryId(entry.id)}
                        >
                          <td className="w-9 px-3 py-2">
                            <input
                              aria-label={`Selecionar ${entryLabel(entry)}`}
                              checked={selected}
                              disabled={pending}
                              onChange={() => onChangeTargetEntryId(entry.id)}
                              type="radio"
                            />
                          </td>
                          <td className="px-3 py-2 text-muted whitespace-nowrap">
                            {formatDate(entry.occurredOn)}
                          </td>
                          <td className="px-3 py-2 text-muted whitespace-nowrap">
                            {entry.walletName ?? entry.walletId}
                          </td>
                          <td className="max-w-[210px] px-3 py-2 text-foreground">
                            <span className="block truncate">
                              {entryLabel(entry)}
                            </span>
                          </td>
                          <td
                            className={`px-3 py-2 text-right font-semibold tabular-nums whitespace-nowrap ${
                              signedAmount < 0
                                ? "text-negative"
                                : "text-positive"
                            }`}
                          >
                            {signedAmount >= 0 ? "+" : ""}
                            {formatMoney(signedAmount)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            {candidates.length === 0 ? (
              <p className="mt-2 text-xs text-muted">
                Nenhuma transacao compativel nos resultados carregados.
              </p>
            ) : null}
            {candidates.length > 0 ? (
              <div className="mt-3 flex items-center justify-between gap-3 text-xs text-muted">
                <span>
                  Pagina {normalizedCandidatePage + 1} de {candidatePageCount}
                </span>
                <div className="inline-flex overflow-hidden rounded-lg border border-border bg-panel">
                  <button
                    className="flex size-8 items-center justify-center text-foreground transition hover:bg-surface disabled:opacity-50"
                    disabled={normalizedCandidatePage === 0}
                    onClick={() =>
                      setCandidatePage((page) => Math.max(0, page - 1))
                    }
                    title="Pagina anterior"
                    type="button"
                  >
                    <ChevronLeft className="size-4" aria-hidden="true" />
                    <span className="sr-only">Pagina anterior</span>
                  </button>
                  <button
                    className="flex size-8 items-center justify-center border-l border-border text-foreground transition hover:bg-surface disabled:opacity-50"
                    disabled={normalizedCandidatePage >= candidatePageCount - 1}
                    onClick={() =>
                      setCandidatePage((page) =>
                        Math.min(candidatePageCount - 1, page + 1),
                      )
                    }
                    title="Proxima pagina"
                    type="button"
                  >
                    <ChevronRight className="size-4" aria-hidden="true" />
                    <span className="sr-only">Proxima pagina</span>
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <PrefixedDropdownField
              onChange={(walletId) => onChangeForm({ ...form, walletId })}
              disabled={pending}
              options={targetWallets.map((wallet) => ({
                label: wallet.name,
                value: wallet.id,
              }))}
              prefix="Carteira"
              value={form.walletId}
            />
            <PrefixedDropdownField
              onChange={(categoryId) => onChangeForm({ ...form, categoryId })}
              disabled={pending}
              options={targetCategories.map((category) => ({
                label: category.name,
                value: category.id,
              }))}
              prefix="Categoria"
              value={form.categoryId}
            />
            <PrefixedDropdownField
              onChange={(nature) =>
                onChangeForm({ ...form, nature: nature as EntryNature })
              }
              disabled={pending}
              options={entryNatures.map((nature) => ({
                label: entryNatureLabels[nature],
                value: nature,
              }))}
              prefix="Natureza"
              value={form.nature}
            />
            <PrefixedField prefix="Descricao">
              <input
                className={prefixedControlClass}
                disabled={pending}
                onChange={(event) =>
                  onChangeForm({ ...form, description: event.target.value })
                }
                value={form.description}
              />
            </PrefixedField>
          </div>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button
            className="h-9 rounded-lg border border-border bg-panel px-4 text-xs font-semibold text-foreground transition hover:bg-surface disabled:opacity-60"
            disabled={pending}
            onClick={onCancel}
            type="button"
          >
            Cancelar
          </button>
          <button
            className="flex h-9 min-w-24 items-center justify-center gap-2 rounded-lg bg-accent px-4 text-xs font-bold text-accent-foreground transition hover:bg-accent/90 disabled:opacity-60"
            disabled={confirmDisabled}
            onClick={onConfirm}
            type="button"
          >
            {pending ? (
              <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
            ) : null}
            {pending ? "Vinculando" : "Vincular"}
          </button>
        </div>
      </div>
    </div>
  );
}

function UnlinkTransferDialog({
  entry,
  onCancel,
  onConfirm,
  pending,
}: {
  readonly entry: Entry;
  readonly onCancel: () => void;
  readonly onConfirm: () => void;
  readonly pending: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-background/70 px-4 backdrop-blur-sm"
      role="presentation"
    >
      <div
        aria-modal="true"
        className="flex w-[min(420px,calc(100vw-2rem))] gap-4 rounded-xl border border-border bg-surface-elevated p-5 shadow-2xl shadow-black/55"
        role="dialog"
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-warning/15 text-warning">
          <Link2Off className="size-4" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-bold text-foreground">
            Desvincular transferencia
          </h2>
          <p className="mt-2 text-xs leading-5 text-muted">
            A transferencia de {entryLabel(entry)} sera removida. Os
            lancamentos vinculados serao mantidos como registros independentes.
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <button
              className="h-9 rounded-lg border border-border bg-panel px-4 text-xs font-semibold text-foreground transition hover:bg-surface disabled:opacity-60"
              disabled={pending}
              onClick={onCancel}
              type="button"
            >
              Cancelar
            </button>
            <button
              className="flex h-9 min-w-28 items-center justify-center gap-2 rounded-lg bg-warning px-4 text-xs font-bold text-background transition hover:bg-warning/90 disabled:opacity-60"
              disabled={pending}
              onClick={onConfirm}
              type="button"
            >
              {pending ? (
                <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
              ) : null}
              {pending ? "Desvinculando" : "Desvincular"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

type DropdownFieldOption = {
  readonly label: string;
  readonly value: string;
};

function PrefixedDropdownField({
  disabled = false,
  onChange,
  options,
  prefix,
  value,
}: {
  readonly disabled?: boolean;
  readonly onChange: (value: string) => void;
  readonly options: readonly DropdownFieldOption[];
  readonly prefix: string;
  readonly value: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);

  return (
    <Dropdown
      onOpenChange={setOpen}
      open={open}
      panelClassName="!z-[140] overflow-hidden rounded-lg border border-border bg-surface-elevated shadow-2xl shadow-black/45"
      trigger={({ open: dropdownOpen, triggerRef }) => (
        <button
          aria-expanded={dropdownOpen}
          className={`${prefixedControlClass} relative flex items-center text-left transition hover:bg-surface-elevated focus-visible:ring-1 focus-visible:ring-accent`}
          disabled={disabled}
          onClick={() => setOpen((current) => !current)}
          ref={(node) => {
            triggerRef.current = node;
          }}
          type="button"
        >
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold uppercase tracking-wider text-muted">
            {prefix}
          </span>
          <span className="min-w-0 flex-1 truncate">
            {selected?.label ?? "Selecione"}
          </span>
          <ChevronDown
            className={`ml-2 size-3.5 shrink-0 text-muted transition ${
              dropdownOpen ? "rotate-180" : ""
            }`}
            aria-hidden="true"
          />
        </button>
      )}
      width="trigger"
    >
      <div className="grid py-1">
        {options.map((option) => {
          const optionSelected = option.value === value;

          return (
            <button
              className="flex min-h-8 w-full items-center gap-2 px-3 text-left text-xs font-semibold text-foreground transition hover:bg-surface"
              disabled={disabled}
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              type="button"
            >
              <span
                className={`flex size-3.5 shrink-0 items-center justify-center rounded border ${
                  optionSelected
                    ? "border-accent bg-accent text-accent-foreground"
                    : "border-border bg-panel"
                }`}
              >
                {optionSelected ? (
                  <Check className="size-2.5" aria-hidden="true" />
                ) : null}
              </span>
              <span className="min-w-0 truncate">{option.label}</span>
            </button>
          );
        })}
        {options.length === 0 ? (
          <span className="px-3 py-2 text-xs text-muted">
            Nenhuma opcao disponivel
          </span>
        ) : null}
      </div>
    </Dropdown>
  );
}

function PrefixedField({
  children,
  prefix,
}: {
  readonly children: ReactNode;
  readonly prefix: string;
}) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-[10px] font-semibold uppercase tracking-wider text-muted">
        {prefix}
      </span>
      {children}
    </div>
  );
}

function DeleteEntryDialog({
  entry,
  onCancel,
  onConfirm,
  pending,
}: {
  readonly entry: Entry;
  readonly onCancel: () => void;
  readonly onConfirm: () => void;
  readonly pending: boolean;
}) {
  const linkedToTransfer = Boolean(entry.transferId);
  const title = linkedToTransfer
    ? "Transacao vinculada a transferencia"
    : "Excluir transacao";
  const description = linkedToTransfer
    ? `"${entryLabel(entry)}" esta vinculada a uma transferencia. Ao remover, a transferencia tambem sera desvinculada. Deseja continuar?`
    : `Tem certeza que deseja excluir "${entryLabel(entry)}"? A transacao sera marcada como excluida.`;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-background/70 px-4 backdrop-blur-sm"
      role="presentation"
    >
      <div
        aria-modal="true"
        className="flex w-[min(385px,calc(100vw-2rem))] gap-4 rounded-xl border border-border bg-surface-elevated p-5 shadow-2xl shadow-black/55"
        role="dialog"
      >
        <span
          className={`flex size-9 shrink-0 items-center justify-center rounded-full ${
            linkedToTransfer
              ? "bg-warning/15 text-warning"
              : "bg-negative/15 text-negative"
          }`}
        >
          {linkedToTransfer ? (
            <Link2Off className="size-4" aria-hidden="true" />
          ) : (
            <AlertTriangle className="size-4" aria-hidden="true" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-bold text-foreground">{title}</h2>
          <p className="mt-2 text-xs leading-5 text-muted">{description}</p>
          <div className="mt-5 flex justify-end gap-2">
            <button
              className="h-9 rounded-lg border border-border bg-panel px-4 text-xs font-semibold text-foreground transition hover:bg-surface disabled:opacity-60"
              disabled={pending}
              onClick={onCancel}
              type="button"
            >
              Cancelar
            </button>
            <button
              className={`h-9 rounded-lg px-4 text-xs font-bold transition disabled:opacity-60 ${
                linkedToTransfer
                  ? "bg-warning text-background hover:bg-warning/90"
                  : "bg-negative text-foreground hover:bg-negative/90"
              }`}
              disabled={pending}
              onClick={onConfirm}
              type="button"
            >
              {linkedToTransfer ? "Desvincular e excluir" : "Excluir"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function EntryFormRow({
  categories,
  form,
  hasError = false,
  onCancel,
  onChange,
  onSave,
  pending,
  wallets,
}: {
  readonly categories: readonly Category[];
  readonly form: EntryForm;
  readonly hasError?: boolean;
  readonly onCancel: () => void;
  readonly onChange: (form: EntryForm) => void;
  readonly onSave: (event: FormEvent<HTMLFormElement>) => void;
  readonly pending: boolean;
  readonly wallets: readonly Wallet[];
}) {
  const firstFieldRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    firstFieldRef.current?.focus();
  }, []);

  return (
    <tr
      className={`border-l-2 ${
        hasError
          ? "border-l-negative bg-negative/10"
          : "border-l-accent bg-surface-elevated/70"
      }`}
    >
      <td colSpan={8} className="px-3 py-3">
        <form className="grid grid-cols-1 gap-2 lg:grid-cols-[130px_180px_1fr_180px_150px_170px_120px_auto]" onSubmit={onSave}>
          <CalendarField
            label="Data da transacao"
            onChange={(occurredOn) => onChange({ ...form, occurredOn })}
            ref={firstFieldRef}
            value={form.occurredOn}
          />
          <select className={inputClass} onChange={(event) => onChange({ ...form, categoryId: event.target.value })} value={form.categoryId}>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <input
            className={inputClass}
            onChange={(event) => onChange({ ...form, description: event.target.value })}
            onKeyDown={(event) => {
              if (event.key === "Escape") onCancel();
            }}
            placeholder="Descricao"
            value={form.description}
          />
          <select className={inputClass} onChange={(event) => onChange({ ...form, walletId: event.target.value })} value={form.walletId}>
            {wallets.map((wallet) => (
              <option key={wallet.id} value={wallet.id}>
                {wallet.name}
              </option>
            ))}
          </select>
          <select className={inputClass} onChange={(event) => onChange({ ...form, nature: event.target.value as EntryNature })} value={form.nature}>
            {entryNatures.map((nature) => (
              <option key={nature} value={nature}>
                {entryNatureLabels[nature]}
              </option>
            ))}
          </select>
          <select className={inputClass} onChange={(event) => onChange({ ...form, economicEvent: event.target.value as EconomicEvent | "" })} value={form.economicEvent}>
            <option value="">Inferir automaticamente</option>
            {economicEvents.map((event) => (
              <option key={event} value={event}>
                {economicEventLabels[event]}
              </option>
            ))}
          </select>
          <CurrencyField
            aria-label="Valor"
            onValueInCentsChange={(amountCents) =>
              onChange({ ...form, amountCents })
            }
            valueInCents={form.amountCents}
          />
          <div className="flex items-center justify-end gap-1">
            <IconButton disabled={pending} label="Salvar lancamento" tone="positive" type="submit">
              <Check className="size-3.5" aria-hidden="true" />
            </IconButton>
            <IconButton label="Cancelar" onClick={onCancel} tone="muted">
              <X className="size-3.5" aria-hidden="true" />
            </IconButton>
          </div>
        </form>
      </td>
    </tr>
  );
}

function EntrySkeletonRow() {
  return (
    <tr className="border-l-2 border-l-accent bg-surface-elevated/70">
      <td colSpan={8} className="px-4 py-3">
        <div className="grid animate-pulse grid-cols-1 gap-3 lg:grid-cols-[100px_160px_1fr_150px_120px_140px_100px_64px]">
          <SkeletonBlock />
          <SkeletonBlock />
          <SkeletonBlock />
          <SkeletonBlock />
          <SkeletonBlock />
          <SkeletonBlock />
          <SkeletonBlock />
          <div className="flex justify-end gap-1">
            <span className="block size-7 rounded-md bg-surface" />
            <span className="block size-7 rounded-md bg-surface" />
          </div>
        </div>
      </td>
    </tr>
  );
}

function SkeletonBlock() {
  return <span className="block h-8 rounded-md bg-surface-elevated" />;
}

function KpiCard({
  label,
  tone = "default",
  value,
}: {
  readonly label: string;
  readonly tone?: "default" | "positive" | "negative";
  readonly value: string;
}) {
  const color =
    tone === "positive"
      ? "border-positive/25 bg-positive/5 text-positive"
      : tone === "negative"
        ? "border-negative/25 bg-negative/5 text-negative"
        : "border-border bg-panel text-foreground";

  return (
    <div className={`rounded-lg border px-4 py-3 ${color}`}>
      <p className="mb-1.5 text-[10px] uppercase tracking-wider opacity-75">{label}</p>
      <p className="text-xl font-bold tabular-nums">{value}</p>
    </div>
  );
}

function Tag({
  children,
  tone = "default",
}: {
  readonly children: ReactNode;
  readonly tone?: "default" | "accent" | "asset";
}) {
  const className =
    tone === "accent"
      ? "border-accent/30 bg-accent/10 text-accent"
      : tone === "asset"
        ? "border-asset/30 bg-asset/10 text-indigo-100"
        : "border-border bg-surface text-muted";

  return (
    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${className}`}>
      {children}
    </span>
  );
}

function FilterSwitch({
  active,
  label,
  onToggle,
}: {
  readonly active: boolean;
  readonly label: string;
  readonly onToggle: () => void;
}) {
  return (
    <button
      aria-pressed={active}
      className={`flex h-8 items-center gap-2 rounded-lg border px-2.5 text-xs font-medium transition focus:outline-none focus-visible:ring-1 focus-visible:ring-accent ${
        active
          ? "border-accent/60 bg-accent/10 text-accent"
          : "border-border bg-panel text-muted hover:bg-surface-elevated hover:text-foreground"
      }`}
      onClick={onToggle}
      type="button"
    >
      <span
        className={`flex h-4 w-7 items-center rounded-full p-0.5 transition ${
          active ? "bg-accent" : "bg-muted/35"
        }`}
      >
        <span
          className={`size-3 rounded-full bg-foreground transition ${
            active ? "translate-x-3" : "translate-x-0"
          }`}
        />
      </span>
      {label}
    </button>
  );
}

function IconButton({
  children,
  disabled,
  label,
  onClick,
  tone,
  type = "button",
}: {
  readonly children: ReactNode;
  readonly disabled?: boolean;
  readonly label: string;
  readonly onClick?: () => void;
  readonly tone: "muted" | "positive" | "negative";
  readonly type?: "button" | "submit";
}) {
  const className =
    tone === "positive"
      ? "bg-positive/15 text-positive hover:bg-positive/25"
      : tone === "negative"
        ? "text-muted hover:bg-negative/10 hover:text-negative"
        : "bg-surface text-muted hover:text-foreground";

  return (
    <button
      className={`flex size-7 shrink-0 items-center justify-center rounded-md transition disabled:opacity-60 ${className}`}
      disabled={disabled}
      onClick={onClick}
      title={label}
      type={type}
    >
      {children}
      <span className="sr-only">{label}</span>
    </button>
  );
}

const inputClass =
  "h-8 rounded-md border border-border bg-surface/70 px-2.5 text-xs text-foreground outline-none focus:ring-1 focus:ring-accent";
const iconButtonClass =
  "flex size-8 shrink-0 items-center justify-center rounded-md text-muted transition hover:bg-surface hover:text-foreground disabled:opacity-50";
const prefixedControlClass =
  "h-9 w-full rounded-lg border border-border bg-surface/70 pl-24 pr-3 text-xs text-foreground outline-none focus:ring-1 focus:ring-accent";
function defaultForm(
  wallets: readonly Wallet[],
  categories: readonly Category[],
): EntryForm {
  return {
    walletId: wallets[0]?.id ?? "",
    categoryId: categories[0]?.id ?? "",
    nature: "OPERATIONAL",
    economicEvent: "",
    amountCents: 0,
    occurredOn: new Date().toISOString().slice(0, 10),
    description: "",
  };
}

function defaultTransferForm(
  wallets: readonly Wallet[],
  categories: readonly Category[],
  source?: Entry,
): EntryForm {
  const walletId =
    wallets.find((wallet) => wallet.id !== source?.walletId)?.id ?? "";
  const categoryType = source?.direction === "OUT" ? "INCOME" : "EXPENSE";
  const categoryId =
    categories.find((category) => category.type === categoryType)?.id ??
    categories[0]?.id ??
    "";

  return {
    walletId,
    categoryId,
    nature: source?.nature ?? "OPERATIONAL",
    economicEvent: "TRANSFER",
    amountCents: source?.amountCents ?? 0,
    occurredOn: source?.occurredOn ?? new Date().toISOString().slice(0, 10),
    description: source?.description ?? "",
  };
}

function requestFromForm(form: EntryForm) {
  return {
    walletId: form.walletId,
    categoryId: form.categoryId,
    nature: form.nature,
    economicEvent: form.economicEvent || undefined,
    amountCents: form.amountCents,
    occurredOn: form.occurredOn,
    description: form.description,
  };
}

function formatMoney(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    currency: "BRL",
    style: "currency",
  }).format(cents / 100);
}

function entryLabel(entry: Entry): string {
  return entry.description || entry.categoryName || "Transacao sem descricao";
}

function formatDate(value: string): string {
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
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
  return `${(bytes / 1024 / 1024).toFixed(1).replace(".", ",")} MB`;
}

function transferCandidates(
  entries: readonly Entry[],
  source: Entry,
): Entry[] {
  return entries.filter(
    (entry) =>
      entry.id !== source.id &&
      !entry.deletedAt &&
      !entry.transferId &&
      entry.walletId !== source.walletId &&
      entry.direction !== source.direction &&
      entry.amountCents === source.amountCents,
  );
}

function mergeEntries(
  current: readonly Entry[],
  incoming: readonly Entry[],
): Entry[] {
  const byId = new Map(current.map((entry) => [entry.id, entry]));

  for (const entry of incoming) {
    byId.set(entry.id, entry);
  }

  return [...byId.values()].sort((a, b) => {
    const date = b.occurredOn.localeCompare(a.occurredOn);
    return date === 0
      ? b.createdAt.toString().localeCompare(a.createdAt.toString())
      : date;
  });
}

async function sendEntryJson(
  url: string,
  body: unknown,
  method = "POST",
): Promise<{ ok: boolean; body: EntryApiResponse }> {
  const response = await fetch(url, {
    method,
    headers: body === null ? undefined : { "Content-Type": "application/json" },
    body: body === null ? undefined : JSON.stringify(body),
  });

  return {
    ok: response.ok,
    body: (await response.json()) as EntryApiResponse,
  };
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}
