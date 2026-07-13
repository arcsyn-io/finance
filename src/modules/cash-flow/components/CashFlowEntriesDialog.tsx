"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Check, LoaderCircle, Pencil, X } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Category } from "@/domain/category/category";
import {
  economicEventLabels,
  economicEvents,
  entryNatureLabels,
  entryNatures,
  type EconomicEvent,
  type Entry,
  type EntryDirection,
  type EntryNature,
} from "@/domain/entry/entry";
import type { Wallet } from "@/domain/wallet/wallet";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { formatMoney } from "@/modules/cash-flow/components/CashFlowMoneyCell";

export type CashFlowDetailSelection = {
  readonly categoryId?: string | null;
  readonly direction: EntryDirection;
  readonly referenceMonth: string;
  readonly scope: "NON_OPERATIONAL" | "OPERATIONAL";
  readonly title: string;
};

type CashFlowEntriesDialogProps = {
  readonly cashWalletIds: readonly string[];
  readonly categories: readonly Category[];
  readonly onClose: () => void;
  readonly selection: CashFlowDetailSelection;
  readonly wallets: readonly Wallet[];
};

type EditableEntryFields = {
  readonly categoryId: string;
  readonly description: string;
  readonly economicEvent: EconomicEvent | "";
  readonly nature: EntryNature;
  readonly walletId: string;
};

export function CashFlowEntriesDialog({
  cashWalletIds,
  categories,
  onClose,
  selection,
  wallets,
}: CashFlowEntriesDialogProps) {
  const router = useRouter();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<EditableEntryFields | null>(null);
  const [saving, setSaving] = useState(false);

  const loadEntries = useCallback(
    async (signal: AbortSignal) => {
      setLoading(true);
      setError(null);
      setSuccess(null);

      if (cashWalletIds.length === 0) {
        setEntries([]);
        setLoading(false);
        return;
      }

      const { endDate, startDate } = monthDateRange(selection.referenceMonth);
      const params = new URLSearchParams({
        endDate,
        startDate,
        walletIds: cashWalletIds.join(","),
      });
      if (selection.scope === "OPERATIONAL") params.set("natures", "OPERATIONAL");
      if (typeof selection.categoryId === "string") {
        params.set("categoryIds", selection.categoryId);
      }

      try {
        const response = await fetch(`/api/entries?${params.toString()}`, { signal });
        const body = (await response.json()) as {
          readonly entries?: Entry[];
          readonly error?: string;
        };

        if (!response.ok) {
          throw new Error(body.error ?? "Não foi possível carregar os lançamentos");
        }

        setEntries(
          (body.entries ?? []).filter((entry) =>
            entryMatchesSelection(entry, selection, cashWalletIds),
          ),
        );
      } catch (loadError) {
        if (!signal.aborted) {
          setEntries([]);
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Não foi possível carregar os lançamentos",
          );
        }
      } finally {
        if (!signal.aborted) setLoading(false);
      }
    },
    [cashWalletIds, selection],
  );

  useEffect(() => {
    const controller = new AbortController();
    void loadEntries(controller.signal);
    return () => controller.abort();
  }, [loadEntries]);

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !saving) onClose();
    }

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onClose, saving]);

  const totalCents = useMemo(
    () => entries.reduce((total, entry) => total + entry.amountCents, 0),
    [entries],
  );

  function startEditing(entry: Entry) {
    setEditingId(entry.id);
    setForm({
      categoryId: entry.categoryId ?? "",
      description: entry.description ?? "",
      economicEvent: entry.economicEvent ?? "",
      nature: entry.nature,
      walletId: entry.walletId,
    });
    setError(null);
    setSuccess(null);
  }

  function cancelEditing() {
    setEditingId(null);
    setForm(null);
    setError(null);
  }

  async function saveEntry(entry: Entry) {
    if (!form) return;
    if (!form.categoryId) {
      setError("Selecione uma categoria para salvar o lançamento");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/entries/${entry.id}`, {
        body: JSON.stringify({
          amountCents: entry.amountCents,
          categoryId: form.categoryId,
          description: form.description.trim() || undefined,
          economicEvent: form.economicEvent || undefined,
          nature: form.nature,
          occurredOn: entry.occurredOn,
          walletId: form.walletId,
        }),
        headers: { "Content-Type": "application/json" },
        method: "PUT",
      });
      const body = (await response.json()) as {
        readonly entry?: Entry;
        readonly error?: string;
      };

      if (!response.ok || !body.entry) {
        throw new Error(body.error ?? "Não foi possível atualizar o lançamento");
      }

      setEntries((current) => {
        const remaining = current.filter((item) => item.id !== entry.id);
        return entryMatchesSelection(body.entry as Entry, selection, cashWalletIds)
          ? [...remaining, body.entry as Entry].sort(compareEntries)
          : remaining;
      });
      setEditingId(null);
      setForm(null);
      setSuccess("Lançamento atualizado. A análise anual foi recalculada.");
      router.refresh();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Não foi possível atualizar o lançamento",
      );
    } finally {
      setSaving(false);
    }
  }

  return createPortal(
    <div
      aria-labelledby="cash-flow-entries-title"
      aria-modal="true"
      className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-6"
      role="dialog"
    >
      <button
        aria-label="Fechar detalhamento"
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        disabled={saving}
        onClick={onClose}
        type="button"
      />
      <section className="relative flex max-h-[88vh] w-full max-w-7xl flex-col overflow-hidden rounded-xl border border-border bg-panel shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-border px-4 py-4 sm:px-6">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-accent">
              {selection.scope === "OPERATIONAL" ? "Fluxo operacional" : "Movimentação não operacional"}
            </p>
            <h2 className="mt-1 text-base font-semibold" id="cash-flow-entries-title">
              {selection.title}
            </h2>
            <p className="mt-1 text-xs text-muted">
              {formatMonth(selection.referenceMonth)}
              {!loading ? ` · ${entries.length} ${entries.length === 1 ? "lançamento" : "lançamentos"} · ${formatMoney(totalCents)}` : ""}
            </p>
          </div>
          <button
            aria-label="Fechar"
            autoFocus
            className="flex size-8 items-center justify-center rounded-lg text-muted transition hover:bg-surface-elevated hover:text-foreground disabled:opacity-50"
            disabled={saving}
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" className="size-4" />
          </button>
        </header>

        <div className="finance-scrollbar min-h-0 flex-1 overflow-auto">
          {loading ? (
            <div className="flex min-h-52 items-center justify-center gap-2 text-xs text-muted">
              <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
              Carregando lançamentos...
            </div>
          ) : error && entries.length === 0 ? (
            <div className="flex min-h-52 items-center justify-center p-8 text-center text-xs text-negative">
              {error}
            </div>
          ) : entries.length === 0 ? (
            <div className="flex min-h-52 flex-col items-center justify-center p-8 text-center">
              <p className="text-sm font-medium">Nenhum lançamento nesta célula</p>
              <p className="mt-1 max-w-md text-xs leading-5 text-muted">
                A composição mudou ou não há fatos financeiros que atendam aos filtros selecionados.
              </p>
            </div>
          ) : (
            <table className="w-full min-w-[1200px] border-collapse">
              <thead>
                <tr>
                  {[
                    "Data",
                    "Descrição",
                    "Categoria",
                    "Carteira",
                    "Natureza",
                    "Evento econômico",
                    "Valor",
                    "Ações",
                  ].map((label) => (
                    <th
                      className="sticky top-0 z-10 bg-panel px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted"
                      key={label}
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => {
                  const editing = editingId === entry.id && form !== null;
                  const categoryOptions = selectableCategories(categories, entry);
                  const walletOptions = selectableWallets(wallets, entry);

                  return (
                    <tr key={entry.id}>
                      <td className="border-t border-border px-4 py-3 text-xs tabular-nums text-muted">
                        {formatDate(entry.occurredOn)}
                      </td>
                      <td className="min-w-56 border-t border-border px-4 py-3 text-xs">
                        {editing ? (
                          <Input
                            aria-label="Descrição"
                            className="h-8 min-w-52"
                            onChange={(event) => setForm({ ...form, description: event.target.value })}
                            placeholder="Sem descrição"
                            value={form.description}
                          />
                        ) : (
                          entry.description || <span className="text-muted">Sem descrição</span>
                        )}
                      </td>
                      <td className="min-w-48 border-t border-border px-4 py-3 text-xs">
                        {editing ? (
                          <Select
                            aria-label="Categoria"
                            className="h-8"
                            onChange={(event) => setForm({ ...form, categoryId: event.target.value })}
                            value={form.categoryId}
                          >
                            <option value="">Selecione uma categoria</option>
                            {categoryOptions.map((category) => (
                              <option key={category.id} value={category.id}>
                                {category.name}{category.active ? "" : " (inativa)"}
                              </option>
                            ))}
                          </Select>
                        ) : (
                          entry.categoryName ?? "Sem categoria"
                        )}
                      </td>
                      <td className="min-w-48 border-t border-border px-4 py-3 text-xs">
                        {editing ? (
                          <Select
                            aria-label="Carteira"
                            className="h-8"
                            onChange={(event) => setForm({ ...form, walletId: event.target.value })}
                            value={form.walletId}
                          >
                            {walletOptions.map((wallet) => (
                              <option key={wallet.id} value={wallet.id}>
                                {wallet.name}{wallet.active ? "" : " (inativa)"}
                              </option>
                            ))}
                          </Select>
                        ) : (
                          entry.walletName ?? "Carteira não encontrada"
                        )}
                      </td>
                      <td className="min-w-40 border-t border-border px-4 py-3 text-xs">
                        {editing ? (
                          <Select
                            aria-label="Natureza"
                            className="h-8"
                            onChange={(event) =>
                              setForm({
                                ...form,
                                nature: event.target.value as EntryNature,
                              })
                            }
                            value={form.nature}
                          >
                            {entryNatures.map((nature) => (
                              <option key={nature} value={nature}>
                                {entryNatureLabels[nature]}
                              </option>
                            ))}
                          </Select>
                        ) : (
                          entryNatureLabels[entry.nature]
                        )}
                      </td>
                      <td className="min-w-48 border-t border-border px-4 py-3 text-xs">
                        {editing ? (
                          <Select
                            aria-label="Evento econômico"
                            className="h-8"
                            onChange={(event) =>
                              setForm({
                                ...form,
                                economicEvent: event.target.value as EconomicEvent | "",
                              })
                            }
                            value={form.economicEvent}
                          >
                            <option value="">Inferir automaticamente</option>
                            {economicEvents.map((economicEvent) => (
                              <option key={economicEvent} value={economicEvent}>
                                {economicEventLabels[economicEvent]}
                              </option>
                            ))}
                          </Select>
                        ) : entry.economicEvent ? (
                          economicEventLabels[entry.economicEvent]
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="border-t border-border px-4 py-3 text-right text-xs font-semibold tabular-nums">
                        {formatMoney(entry.amountCents)}
                      </td>
                      <td className="border-t border-border px-4 py-3 text-right">
                        {editing ? (
                          <div className="flex justify-end gap-1">
                            <IconButton disabled={saving} label="Cancelar edição" onClick={cancelEditing}>
                              <X />
                            </IconButton>
                            <IconButton disabled={saving} label="Salvar lançamento" onClick={() => void saveEntry(entry)}>
                              {saving ? <LoaderCircle className="animate-spin" /> : <Check />}
                            </IconButton>
                          </div>
                        ) : (
                          <IconButton disabled={saving || editingId !== null} label="Editar lançamento" onClick={() => startEditing(entry)}>
                            <Pencil />
                          </IconButton>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td className="border-t border-border bg-surface/50 px-4 py-3 text-xs font-semibold" colSpan={6}>
                    Total da célula
                  </td>
                  <td className="border-t border-border bg-surface/50 px-4 py-3 text-right text-xs font-semibold tabular-nums">
                    {formatMoney(totalCents)}
                  </td>
                  <td className="border-t border-border bg-surface/50" />
                </tr>
              </tfoot>
            </table>
          )}
        </div>

        {error && entries.length > 0 ? (
          <p className="border-t border-border bg-negative/10 px-4 py-3 text-xs text-negative sm:px-6" role="alert">
            {error}
          </p>
        ) : null}
        {success ? (
          <p className="border-t border-border bg-positive/10 px-4 py-3 text-xs text-positive sm:px-6" role="status">
            {success}
          </p>
        ) : null}
      </section>
    </div>,
    document.body,
  );
}

function IconButton({
  children,
  disabled,
  label,
  onClick,
}: {
  readonly children: React.ReactElement;
  readonly disabled?: boolean;
  readonly label: string;
  readonly onClick: () => void;
}) {
  return (
    <button
      aria-label={label}
      className="flex size-8 items-center justify-center rounded-md text-muted transition hover:bg-surface-elevated hover:text-foreground disabled:opacity-40 [&_svg]:size-3.5"
      disabled={disabled}
      onClick={onClick}
      title={label}
      type="button"
    >
      {children}
    </button>
  );
}

function entryMatchesSelection(
  entry: Entry,
  selection: CashFlowDetailSelection,
  cashWalletIds: readonly string[],
): boolean {
  if (!cashWalletIds.includes(entry.walletId)) return false;
  if (entry.direction !== selection.direction) return false;
  if (selection.categoryId !== undefined && entry.categoryId !== selection.categoryId) {
    return false;
  }

  return selection.scope === "OPERATIONAL"
    ? entry.nature === "OPERATIONAL" && entry.transferId === null
    : entry.nature === "PATRIMONIAL" || entry.transferId !== null;
}

function selectableCategories(
  categories: readonly Category[],
  entry: Entry,
): readonly Category[] {
  return categories.filter(
    (category) => category.active || category.id === entry.categoryId,
  );
}

function selectableWallets(wallets: readonly Wallet[], entry: Entry): readonly Wallet[] {
  return wallets.filter((wallet) => wallet.active || wallet.id === entry.walletId);
}

function compareEntries(left: Entry, right: Entry): number {
  return right.occurredOn.localeCompare(left.occurredOn);
}

function monthDateRange(referenceMonth: string) {
  const [year, month] = referenceMonth.split("-").map(Number);
  const finalDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return {
    endDate: `${referenceMonth}-${String(finalDay).padStart(2, "0")}`,
    startDate: `${referenceMonth}-01`,
  };
}

function formatDate(value: string): string {
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

function formatMonth(referenceMonth: string): string {
  const [year, month] = referenceMonth.split("-").map(Number);
  const label = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    timeZone: "UTC",
    year: "numeric",
  }).format(new Date(Date.UTC(year, month - 1, 1)));
  return label.charAt(0).toUpperCase() + label.slice(1);
}
