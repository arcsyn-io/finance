"use client";

import {
  FormEvent,
  ReactNode,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import {
  Check,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
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
import { CategoryBadge } from "@/modules/categories/components/CategoryBadge";

type EntriesTableProps = {
  readonly initialEntries: readonly Entry[];
  readonly wallets: readonly Wallet[];
  readonly categories: readonly Category[];
  readonly initialStartDate: string;
  readonly initialEndDate: string;
};

type EntryForm = {
  readonly walletId: string;
  readonly categoryId: string;
  readonly nature: EntryNature;
  readonly economicEvent: EconomicEvent | "";
  readonly amountCents: number;
  readonly occurredOn: string;
  readonly description: string;
};

type EntryApiResponse = {
  readonly status?: string;
  readonly entry?: Entry;
  readonly entries?: Entry[];
  readonly error?: string;
};

const statusMessages: Record<string, string> = {
  created: "Lancamento criado com sucesso",
  updated: "Lancamento atualizado com sucesso",
  deleted: "Lancamento excluido com sucesso",
  restored: "Lancamento restaurado com sucesso",
};

export function EntriesTable({
  categories,
  initialEndDate,
  initialEntries,
  initialStartDate,
  wallets,
}: EntriesTableProps) {
  const [entries, setEntries] = useState(() => [...initialEntries]);
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);
  const [walletFilter, setWalletFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [natureFilter, setNatureFilter] = useState("");
  const [eventFilter, setEventFilter] = useState("");
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<EntryForm>(() =>
    defaultForm(wallets, categories),
  );
  const [toast, setToast] = useState<SystemToastMessage | null>(null);
  const [pending, startTransition] = useTransition();
  const addButtonRef = useRef<HTMLButtonElement | null>(null);

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

  function successMessage(status: string | undefined) {
    return status ? statusMessages[status] ?? "Operacao concluida" : "Operacao concluida";
  }

  async function refreshEntries(nextRange?: Pick<PeriodFilterRange, "endDate" | "startDate">) {
    const params = new URLSearchParams();
    params.set("startDate", nextRange?.startDate ?? startDate);
    params.set("endDate", nextRange?.endDate ?? endDate);
    params.set("includeDeleted", String(includeDeleted));

    if (walletFilter) params.set("walletIds", walletFilter);
    if (categoryFilter) params.set("categoryIds", categoryFilter);
    if (natureFilter) params.set("natures", natureFilter);
    if (eventFilter) params.set("economicEvents", eventFilter);

    const response = await fetch(`/api/entries?${params.toString()}`);
    const body = (await response.json()) as EntryApiResponse;

    if (!response.ok) {
      showToast("error", body.error ?? "Nao foi possivel carregar lancamentos");
      return;
    }

    setEntries(body.entries ?? []);
  }

  function changePeriod(range: PeriodFilterRange) {
    setStartDate(range.startDate);
    setEndDate(range.endDate);
    startTransition(() => void refreshEntries(range));
  }

  function startAdd() {
    setEditingId(null);
    setAdding(true);
    setForm(defaultForm(wallets, categories));
  }

  function startEdit(entry: Entry) {
    setAdding(false);
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
    setTimeout(() => addButtonRef.current?.focus(), 0);
  }

  async function saveAdd(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();

    const response = await sendEntryJson("/api/entries", requestFromForm(form));

    if (!response.ok) {
      showToast("error", response.body.error ?? "Nao foi possivel salvar");
      return;
    }

    if (response.body.entry) {
      setEntries((current) => [response.body.entry as Entry, ...current]);
    }

    setAdding(false);
    showToast("success", successMessage(response.body.status));
  }

  async function saveEdit(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();

    if (!editingId) {
      return;
    }

    const response = await sendEntryJson(
      `/api/entries/${editingId}`,
      requestFromForm(form),
      "PUT",
    );

    if (!response.ok) {
      showToast("error", response.body.error ?? "Nao foi possivel salvar");
      return;
    }

    if (response.body.entry) {
      setEntries((current) =>
        current.map((entry) =>
          entry.id === editingId ? (response.body.entry as Entry) : entry,
        ),
      );
    }

    setEditingId(null);
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

    showToast("success", successMessage(response.body.status));
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

    showToast("success", successMessage(response.body.status));
  }

  return (
    <div className="flex w-full flex-col gap-4 lg:gap-6">
      {toast ? <SystemToast onDismiss={() => setToast(null)} toast={toast} /> : null}

      <div className="flex flex-wrap items-end gap-2">
        <PeriodFilter
          initialEndDate={initialEndDate}
          initialPreset="current-month"
          initialStartDate={initialStartDate}
          onChange={changePeriod}
        />
        <SelectFilter label="Carteira" onChange={setWalletFilter} value={walletFilter}>
          <option value="">Todas</option>
          {wallets.map((wallet) => (
            <option key={wallet.id} value={wallet.id}>
              {wallet.name}
            </option>
          ))}
        </SelectFilter>
        <SelectFilter label="Categoria" onChange={setCategoryFilter} value={categoryFilter}>
          <option value="">Todas</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </SelectFilter>
        <SelectFilter label="Natureza" onChange={setNatureFilter} value={natureFilter}>
          <option value="">Todas</option>
          {entryNatures.map((nature) => (
            <option key={nature} value={nature}>
              {entryNatureLabels[nature]}
            </option>
          ))}
        </SelectFilter>
        <SelectFilter label="Evento" onChange={setEventFilter} value={eventFilter}>
          <option value="">Todos</option>
          {economicEvents.map((event) => (
            <option key={event} value={event}>
              {economicEventLabels[event]}
            </option>
          ))}
        </SelectFilter>
        <label className="flex h-8 items-center gap-2 rounded-lg border border-border bg-panel px-2.5 text-xs text-muted">
          <input
            checked={includeDeleted}
            className="accent-accent"
            onChange={(event) => setIncludeDeleted(event.target.checked)}
            type="checkbox"
          />
          Excluidos
        </label>
        <button
          className="flex h-8 items-center gap-1.5 rounded-lg border border-border bg-panel px-3 text-xs font-medium text-foreground transition hover:bg-surface-elevated"
          onClick={() => startTransition(() => void refreshEntries())}
          type="button"
        >
          Filtrar
        </button>
        <div className="flex-1" />
        <button
          className="flex h-8 items-center gap-1.5 rounded-lg bg-accent px-3 text-xs font-semibold text-accent-foreground transition hover:bg-accent/90"
          onClick={startAdd}
          type="button"
        >
          <Plus className="size-3.5" aria-hidden="true" />
          Adicionar
        </button>
      </div>

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

      <div className="overflow-hidden rounded-xl border border-border">
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
                  <EntryFormRow
                    categories={categories}
                    form={form}
                    key={entry.id}
                    onCancel={cancelForm}
                    onChange={setForm}
                    onSave={(event) => startTransition(() => void saveEdit(event))}
                    pending={pending}
                    wallets={wallets}
                  />
                ) : (
                  <EntryDisplayRow
                    category={entry.categoryId ? categoriesById.get(entry.categoryId) : undefined}
                    entry={entry}
                    key={entry.id}
                    onDelete={() => startTransition(() => void softDelete(entry))}
                    onEdit={() => startEdit(entry)}
                    onRestore={() => startTransition(() => void restore(entry))}
                    pending={pending}
                  />
                ),
              )}

              {adding ? (
                <EntryFormRow
                  categories={categories}
                  form={form}
                  onCancel={cancelForm}
                  onChange={setForm}
                  onSave={(event) => startTransition(() => void saveAdd(event))}
                  pending={pending}
                  wallets={wallets}
                />
              ) : null}
            </tbody>
          </table>
        </div>

        {!adding ? (
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
  onRestore,
  pending,
}: {
  readonly category?: Category;
  readonly entry: Entry;
  readonly onDelete: () => void;
  readonly onEdit: () => void;
  readonly onRestore: () => void;
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
        <div className="flex items-center justify-end gap-1 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
          {deleted ? (
            <IconButton disabled={pending} label="Restaurar lancamento" onClick={onRestore} tone="positive">
              <RotateCcw className="size-3.5" aria-hidden="true" />
            </IconButton>
          ) : (
            <>
              <IconButton label="Editar lancamento" onClick={onEdit} tone="muted">
                <Pencil className="size-3.5" aria-hidden="true" />
              </IconButton>
              <IconButton disabled={pending} label="Excluir lancamento" onClick={onDelete} tone="negative">
                <Trash2 className="size-3.5" aria-hidden="true" />
              </IconButton>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

function EntryFormRow({
  categories,
  form,
  onCancel,
  onChange,
  onSave,
  pending,
  wallets,
}: {
  readonly categories: readonly Category[];
  readonly form: EntryForm;
  readonly onCancel: () => void;
  readonly onChange: (form: EntryForm) => void;
  readonly onSave: (event: FormEvent<HTMLFormElement>) => void;
  readonly pending: boolean;
  readonly wallets: readonly Wallet[];
}) {
  return (
    <tr className="border-l-2 border-l-accent bg-surface-elevated/70">
      <td colSpan={8} className="px-3 py-3">
        <form className="grid grid-cols-1 gap-2 lg:grid-cols-[130px_180px_1fr_180px_150px_170px_120px_auto]" onSubmit={onSave}>
          <input
            autoFocus
            className={inputClass}
            onChange={(event) => onChange({ ...form, occurredOn: event.target.value })}
            type="date"
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
          <input
            className={`${inputClass} text-right`}
            min={1}
            onChange={(event) => onChange({ ...form, amountCents: reaisToCents(event.target.value) })}
            placeholder="R$ 0,00"
            step="0.01"
            type="number"
            value={form.amountCents / 100}
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

function SelectFilter({
  children,
  label,
  onChange,
  value,
}: {
  readonly children: ReactNode;
  readonly label: string;
  readonly onChange: (value: string) => void;
  readonly value: string;
}) {
  return (
    <label className="flex flex-col gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted">
      {label}
      <select className={filterClass} onChange={(event) => onChange(event.target.value)} value={value}>
        {children}
      </select>
    </label>
  );
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
      type={type}
    >
      {children}
      <span className="sr-only">{label}</span>
    </button>
  );
}

const inputClass =
  "h-8 rounded-md border border-border bg-surface/70 px-2.5 text-xs text-foreground outline-none focus:ring-1 focus:ring-accent";
const filterClass =
  "h-8 rounded-lg border border-border bg-panel px-2.5 text-xs font-normal normal-case tracking-normal text-foreground outline-none focus:ring-1 focus:ring-accent";

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

function formatDate(value: string): string {
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

function reaisToCents(value: string): number {
  return Math.round(Number(value || 0) * 100);
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
