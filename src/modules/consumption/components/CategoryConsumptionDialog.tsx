"use client";

import { useEffect, useState, useTransition } from "react";
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
  type EntryNature,
} from "@/domain/entry/entry";

type CategorySummary = {
  readonly categoryId: string;
  readonly name: string;
  readonly color: string;
  readonly totalCents: number;
  readonly percentage: number;
};

type CategoryConsumptionDialogProps = {
  readonly category: CategorySummary;
  readonly categories: readonly Category[];
  readonly startDate: string;
  readonly endDate: string;
  readonly onClose: () => void;
};

type EditableFields = {
  readonly categoryId: string;
  readonly nature: EntryNature;
  readonly economicEvent: EconomicEvent;
};

export function CategoryConsumptionDialog({
  category,
  categories,
  startDate,
  endDate,
  onClose,
}: CategoryConsumptionDialogProps) {
  const router = useRouter();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<EditableFields | null>(null);
  const [saving, startSaving] = useTransition();

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({
      startDate,
      endDate,
      categoryIds: category.categoryId,
      natures: "PATRIMONIAL",
    });

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/entries?${params.toString()}`, {
          signal: controller.signal,
        });
        const body = (await response.json()) as {
          readonly entries?: Entry[];
          readonly error?: string;
        };
        if (!response.ok) throw new Error(body.error ?? "Nao foi possivel carregar os lancamentos");
        setEntries((body.entries ?? []).filter((entry) => entry.direction === "OUT"));
      } catch (loadError) {
        if (!controller.signal.aborted) {
          setError(loadError instanceof Error ? loadError.message : "Nao foi possivel carregar os lancamentos");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void load();
    return () => controller.abort();
  }, [category.categoryId, endDate, startDate]);

  function startEditing(entry: Entry) {
    setEditingId(entry.id);
    setForm({
      categoryId: entry.categoryId ?? category.categoryId,
      nature: entry.nature,
      economicEvent: entry.economicEvent ?? "CONSUMPTION",
    });
    setError(null);
  }

  function save(entry: Entry) {
    if (!form) return;
    startSaving(async () => {
      setError(null);
      const response = await fetch(`/api/entries/${entry.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletId: entry.walletId,
          categoryId: form.categoryId,
          nature: form.nature,
          economicEvent: form.economicEvent,
          amountCents: entry.amountCents,
          occurredOn: entry.occurredOn,
          description: entry.description ?? undefined,
        }),
      });
      const body = (await response.json()) as {
        readonly entry?: Entry;
        readonly error?: string;
      };
      if (!response.ok || !body.entry) {
        setError(body.error ?? "Nao foi possivel atualizar o lancamento");
        return;
      }

      setEntries((current) =>
        body.entry?.nature === "PATRIMONIAL" &&
        body.entry.direction === "OUT" &&
        body.entry.categoryId === category.categoryId
          ? current.map((item) => (item.id === entry.id ? body.entry as Entry : item))
          : current.filter((item) => item.id !== entry.id),
      );
      setEditingId(null);
      setForm(null);
      router.refresh();
    });
  }

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-6" role="dialog" aria-modal="true" aria-labelledby="consumption-dialog-title">
      <button aria-label="Fechar detalhamento" className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} type="button" />
      <section className="relative flex max-h-[88vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-border bg-panel shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-border px-4 py-4 sm:px-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="size-2.5 rounded-full" style={{ backgroundColor: category.color }} />
              <h2 className="text-base font-semibold" id="consumption-dialog-title">{category.name}</h2>
            </div>
            <p className="mt-1 text-xs text-muted">
              {formatMoney(category.totalCents)} · {formatPercentage(category.percentage)} do consumo
            </p>
          </div>
          <button aria-label="Fechar" className="flex size-8 items-center justify-center rounded-lg text-muted transition hover:bg-surface-elevated hover:text-foreground" onClick={onClose} type="button">
            <X className="size-4" aria-hidden="true" />
          </button>
        </header>

        <div className="overflow-auto">
          {loading ? (
            <div className="flex min-h-48 items-center justify-center gap-2 text-xs text-muted">
              <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> Carregando lancamentos...
            </div>
          ) : entries.length === 0 ? (
            <p className="p-8 text-center text-xs text-muted">Nenhum lancamento permanece nesta categoria.</p>
          ) : (
            <table className="w-full min-w-[850px] border-collapse">
              <thead>
                <tr>
                  {['Data', 'Descricao', 'Categoria', 'Natureza', 'Evento economico', 'Valor', ''].map((label) => (
                    <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted" key={label}>{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => {
                  const editing = editingId === entry.id && form;
                  return (
                    <tr key={entry.id}>
                      <td className="border-t border-border px-4 py-3 text-xs tabular-nums text-muted">{formatDate(entry.occurredOn)}</td>
                      <td className="max-w-56 truncate border-t border-border px-4 py-3 text-xs">{entry.description || "Sem descricao"}</td>
                      <td className="border-t border-border px-4 py-3 text-xs">
                        {editing ? <select className={selectClass} value={form.categoryId} onChange={(event) => setForm({ ...form, categoryId: event.target.value })}>{categoryOptions(categories, entry).map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}</select> : entry.categoryName}
                      </td>
                      <td className="border-t border-border px-4 py-3 text-xs">
                        {editing ? <select className={selectClass} value={form.nature} onChange={(event) => setForm({ ...form, nature: event.target.value as EntryNature })}>{entryNatures.map((nature) => <option key={nature} value={nature}>{entryNatureLabels[nature]}</option>)}</select> : entryNatureLabels[entry.nature]}
                      </td>
                      <td className="border-t border-border px-4 py-3 text-xs">
                        {editing ? <select className={selectClass} value={form.economicEvent} onChange={(event) => setForm({ ...form, economicEvent: event.target.value as EconomicEvent })}>{economicEvents.map((economicEvent) => <option key={economicEvent} value={economicEvent}>{economicEventLabels[economicEvent]}</option>)}</select> : entry.economicEvent ? economicEventLabels[entry.economicEvent] : "-"}
                      </td>
                      <td className="border-t border-border px-4 py-3 text-right text-xs font-semibold tabular-nums">{formatMoney(entry.amountCents)}</td>
                      <td className="border-t border-border px-4 py-3 text-right">
                        {editing ? (
                          <div className="flex justify-end gap-1">
                            <IconButton label="Cancelar" onClick={() => { setEditingId(null); setForm(null); }}><X /></IconButton>
                            <IconButton disabled={saving} label="Salvar" onClick={() => save(entry)}><Check /></IconButton>
                          </div>
                        ) : <IconButton label="Editar lancamento" onClick={() => startEditing(entry)}><Pencil /></IconButton>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
        {error ? <p className="border-t border-border bg-negative/10 px-4 py-3 text-xs text-negative sm:px-6">{error}</p> : null}
      </section>
    </div>,
    document.body,
  );
}

const selectClass = "h-8 min-w-32 rounded-md border border-border bg-surface px-2 text-xs text-foreground outline-none focus:border-accent";

function IconButton({ children, disabled, label, onClick }: { readonly children: React.ReactElement; readonly disabled?: boolean; readonly label: string; readonly onClick: () => void }) {
  return <button aria-label={label} className="flex size-7 items-center justify-center rounded-md text-muted transition hover:bg-surface-elevated hover:text-foreground disabled:opacity-50 [&_svg]:size-3.5" disabled={disabled} onClick={onClick} type="button">{children}</button>;
}

function categoryOptions(categories: readonly Category[], entry: Entry): readonly Pick<Category, "id" | "name">[] {
  if (!entry.categoryId || categories.some((category) => category.id === entry.categoryId)) return categories;
  return [{ id: entry.categoryId, name: entry.categoryName ?? "Categoria atual" }, ...categories];
}

function formatMoney(valueInCents: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valueInCents / 100);
}

function formatDate(value: string): string {
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

function formatPercentage(value: number): string {
  return `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(value)}%`;
}
