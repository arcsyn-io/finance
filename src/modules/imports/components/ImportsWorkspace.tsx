"use client";

import { FormEvent, useRef, useState, useTransition } from "react";
import {
  Ban,
  Check,
  ChevronDown,
  ChevronLeft,
  FileText,
  Loader2,
  Plus,
  RotateCcw,
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
import type { ImportRequest, ImportRow, ImportSource } from "@/domain/import/import";
import { importSourceLabels, importStatusLabels } from "@/domain/import/import";
import type { Wallet } from "@/domain/wallet/wallet";
import { SystemToast, type SystemToastMessage } from "@/components/ui/system-toast";
import { CurrencyField } from "@/components/ui/CurrencyField";
import { CalendarField } from "@/components/ui/CalendarField";
import { Dropdown } from "@/components/ui/Dropdown";
import { CategorySelect } from "@/components/domain/CategorySelect";

type ImportsWorkspaceProps = {
  readonly initialImports: readonly ImportRequest[];
  readonly wallets: readonly Wallet[];
  readonly categories: readonly Category[];
};

type ImportApiResponse = {
  readonly imports?: ImportRequest[];
  readonly importRequest?: ImportRequest;
  readonly row?: ImportRow;
  readonly status?: string;
  readonly result?: { importedCount: number; skippedCount: number };
  readonly error?: string;
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

export function ImportsWorkspace({
  categories,
  initialImports,
  wallets,
}: ImportsWorkspaceProps) {
  const [imports, setImports] = useState(() => [...initialImports]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [toast, setToast] = useState<SystemToastMessage | null>(null);
  const [pending, startTransition] = useTransition();

  const selected = imports.find((item) => item.id === selectedId) ?? null;

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

    setImports((current) =>
      current.map((item) => (item.id === id ? body.importRequest as ImportRequest : item)),
    );
  }

  function replaceImportRow(importRequestId: string, row: ImportRow) {
    setImports((current) =>
      current.map((item) =>
        item.id === importRequestId
          ? {
              ...item,
              rows: item.rows.map((currentRow) =>
                currentRow.id === row.id ? row : currentRow,
              ),
            }
          : item,
      ),
    );
  }

  function patchImportRow(
    importRequestId: string,
    rowId: string,
    patch: Partial<ImportRow>,
  ) {
    setImports((current) =>
      current.map((item) =>
        item.id === importRequestId
          ? {
              ...item,
              rows: item.rows.map((currentRow) =>
                currentRow.id === rowId
                  ? { ...currentRow, ...patch }
                  : currentRow,
              ),
            }
          : item,
      ),
    );
  }

  async function createImport(formData: FormData) {
    const response = await fetch("/api/imports", {
      method: "POST",
      body: formData,
    });
    const body = (await response.json()) as ImportApiResponse;

    if (!response.ok || !body.importRequest) {
      showToast("error", body.error ?? "Nao foi possivel importar arquivo");
      return;
    }

    setImports((current) => [body.importRequest as ImportRequest, ...current]);
    setSelectedId(body.importRequest.id);
    setShowUpload(false);
    showToast("success", "Arquivo enviado para revisao");
  }

  async function confirmImport(id: string) {
    const response = await fetch(`/api/imports/${id}/confirm`, { method: "POST" });
    const body = (await response.json()) as ImportApiResponse;

    if (!response.ok) {
      showToast("error", body.error ?? "Nao foi possivel confirmar importacao");
      return;
    }

    await refreshImport(id);
    showToast(
      "success",
      `Importacao confirmada: ${body.result?.importedCount ?? 0} lancamentos criados`,
    );
  }

  if (selected) {
    return (
      <ImportReview
        categories={categories}
        importRequest={selected}
        onBack={() => setSelectedId(null)}
        onPatchRow={(rowId, patch) => patchImportRow(selected.id, rowId, patch)}
        onRefresh={() => refreshImport(selected.id)}
        onReplaceRow={(row) => replaceImportRow(selected.id, row)}
        onToast={showToast}
        onConfirm={() => startTransition(() => void confirmImport(selected.id))}
        pending={pending}
        wallets={wallets}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4 lg:gap-6">
      {toast ? <SystemToast onDismiss={() => setToast(null)} toast={toast} /> : null}
      {showUpload ? (
        <UploadImportDialog
          categories={categories}
          onClose={() => setShowUpload(false)}
          onSubmit={(formData) => startTransition(() => void createImport(formData))}
          pending={pending}
          wallets={wallets}
        />
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
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
                {["Criado em", "Arquivo", "Origem", "Status", "Total", "Pendentes", "Ignoradas", ""].map((heading) => (
                  <th
                    className={`px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted ${
                      ["Total", "Pendentes", "Ignoradas"].includes(heading) ? "text-right" : "text-left"
                    }`}
                    key={heading}
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-panel">
              {imports.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-center text-xs italic text-muted" colSpan={8}>
                    Nenhuma importacao encontrada.
                  </td>
                </tr>
              ) : null}
              {imports.map((item) => {
                const ignored = item.rows.filter((row) => row.ignoredAt).length;
                const pendingRows = item.rows.filter((row) => !row.entryId && !row.ignoredAt).length;

                return (
                  <tr
                    className="cursor-pointer transition hover:bg-surface-elevated"
                    key={item.id}
                    onClick={() => setSelectedId(item.id)}
                  >
                    <td className="px-4 py-3 text-muted">{formatDateTime(item.createdAt)}</td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-2 font-semibold text-foreground">
                        <FileText className="size-3.5 text-muted" aria-hidden="true" />
                        {item.fileName}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted">{importSourceLabels[item.source]}</td>
                    <td className="px-4 py-3"><StatusBadge label={importStatusLabels[item.status]} /></td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums">{item.rows.length}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-warning">{pendingRows}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted">{ignored}</td>
                    <td className="px-4 py-3 text-right text-accent">Revisar</td>
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
  importRequest,
  onBack,
  onConfirm,
  onPatchRow,
  onRefresh,
  onReplaceRow,
  onToast,
  pending,
  wallets,
}: {
  readonly categories: readonly Category[];
  readonly importRequest: ImportRequest;
  readonly onBack: () => void;
  readonly onConfirm: () => void;
  readonly onPatchRow: (rowId: string, patch: Partial<ImportRow>) => void;
  readonly onRefresh: () => void;
  readonly onReplaceRow: (row: ImportRow) => void;
  readonly onToast: (tone: "success" | "error", message: string) => void;
  readonly pending: boolean;
  readonly wallets: readonly Wallet[];
}) {
  const [savingRowIds, setSavingRowIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const confirmed = importRequest.status === "CONFIRMED";
  const totals = summarizeRows(importRequest.rows);

  async function patchRow(row: ImportRow, patch: Partial<RowPatch>) {
    const optimisticPatch: Partial<ImportRow> = {
      ...patch,
      updatedAt: new Date(),
    };
    onPatchRow(row.id, optimisticPatch);
    setSavingRowIds((current) => new Set(current).add(row.id));

    const response = await sendImportJson(
      `/api/imports/${importRequest.id}/rows/${row.id}`,
      rowToPatchBody(row, patch),
      "PATCH",
    );

    setSavingRowIds((current) => {
      const next = new Set(current);
      next.delete(row.id);
      return next;
    });

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

    const response = await sendImportJson(
      `/api/imports/${importRequest.id}/rows/${row.id}`,
      { ignored },
      "PATCH",
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

  return (
    <div className="flex flex-col gap-4 lg:gap-6">
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
          className="flex h-9 items-center gap-2 rounded-lg bg-accent px-4 text-xs font-bold text-accent-foreground transition hover:bg-accent/90 disabled:opacity-60"
          disabled={confirmed || pending || totals.active === 0}
          onClick={onConfirm}
          type="button"
        >
          {pending ? <Loader2 className="size-3.5 animate-spin" aria-hidden="true" /> : <Check className="size-3.5" aria-hidden="true" />}
          Confirmar importacao
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Total" value={String(importRequest.rows.length)} />
        <KpiCard label="A revisar" tone="warning" value={String(totals.active)} />
        <KpiCard label="Ignoradas" value={String(totals.ignored)} />
        <KpiCard label="Confirmadas" tone="positive" value={String(totals.confirmed)} />
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1120px] text-xs">
            <thead>
              <tr className="border-b border-border bg-panel">
                {["Data", "Descricao", "Carteira", "Categoria", "Natureza", "Evento", "Valor", "Status", ""].map((heading) => (
                  <th
                    className={`px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted ${
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
              {importRequest.rows.map((row) => {
                return (
                  <tr className={row.ignoredAt ? "opacity-55" : ""} key={row.id}>
                    <td className="px-3 py-3">
                      <CalendarField
                        disabled={confirmed}
                        label="Data"
                        onChange={(occurredOn) => void patchRow(row, { occurredOn })}
                        value={row.occurredOn}
                      />
                    </td>
                    <td className="px-3 py-3">
                      <input
                        className={inputClass}
                        disabled={confirmed}
                        onChange={(event) =>
                          void patchRow(row, { description: event.target.value })
                        }
                        value={row.description ?? ""}
                      />
                    </td>
                    <td className="px-3 py-3">
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
                    </td>
                    <td className="px-3 py-3">
                      <CategorySelect
                        categories={categories}
                        disabled={confirmed}
                        label={row.categoryName ?? importRequest.defaultCategoryName ?? "Categoria"}
                        mode="single"
                        onChange={(values) =>
                          void patchRow(row, { categoryId: values[0] ?? null })
                        }
                        selectedValues={row.categoryId ? [row.categoryId] : []}
                      />
                    </td>
                    <td className="px-3 py-3">
                      <InlineDropdown
                        disabled={confirmed}
                        emptyLabel="A definir"
                        onChange={(nature) =>
                          void patchRow(row, {
                            nature: nature as EntryNature | null,
                          })
                        }
                        options={entryNatures.map((nature) => ({
                          label: entryNatureLabels[nature],
                          value: nature,
                        }))}
                        value={row.nature}
                      />
                    </td>
                    <td className="px-3 py-3">
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
                    </td>
                    <td className="px-3 py-3">
                      <CurrencyField
                        aria-label="Valor"
                        className="h-9"
                        disabled={confirmed}
                        onValueInCentsChange={(amountCents) =>
                          void patchRow(row, { amountCents })
                        }
                        valueInCents={row.amountCents}
                      />
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        {row.entryId ? <StatusBadge label="Confirmada" tone="positive" /> : row.ignoredAt ? <StatusBadge label="Ignorada" /> : <StatusBadge label="Pendente" tone="warning" />}
                        {savingRowIds.has(row.id) ? (
                          <Loader2 className="size-3 animate-spin text-muted" />
                        ) : null}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex justify-end gap-1">
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
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function UploadImportDialog({
  categories,
  onClose,
  onSubmit,
  pending,
  wallets,
}: {
  readonly categories: readonly Category[];
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
          <button className={iconButtonClass} onClick={onClose} type="button">
            <X className="size-3.5" />
          </button>
        </div>
        <div className="grid gap-4 px-5 py-4">
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
        </div>
        <div className="flex justify-end gap-2 border-t border-border px-5 py-4">
          <button className="h-9 rounded-lg border border-border px-4 text-xs font-semibold text-foreground" disabled={pending} onClick={onClose} type="button">
            Cancelar
          </button>
          <button className="flex h-9 items-center gap-2 rounded-lg bg-accent px-4 text-xs font-bold text-accent-foreground disabled:opacity-60" disabled={pending} type="submit">
            {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Upload className="size-3.5" />}
            Enviar
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
  const selected = options.find((option) => option.value === value);

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
  method: "PUT" | "PATCH",
): Promise<{ ok: boolean; body: ImportApiResponse }> {
  const response = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  return { ok: response.ok, body: (await response.json()) as ImportApiResponse };
}

function formatDateTime(value: Date | string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

const iconButtonClass =
  "flex size-8 shrink-0 items-center justify-center rounded-md text-muted transition hover:bg-surface hover:text-foreground disabled:opacity-50";
const inputClass =
  "h-9 rounded-lg border border-border bg-surface/70 px-2.5 text-xs text-foreground outline-none focus:ring-1 focus:ring-accent";
