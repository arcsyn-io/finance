"use client";

import {
  FormEvent,
  Fragment,
  ReactNode,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { Check, Pencil, Plus, RotateCcw, Search, Trash2, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { Category } from "@/domain/category/category";
import type { Entry } from "@/domain/entry/entry";
import type { Wallet, WalletType } from "@/domain/wallet/wallet";
import { walletTypeLabels, walletTypes } from "@/domain/wallet/wallet";
import { FilterSelect } from "@/components/ui/FilterSelect";
import {
  SystemToast,
  type SystemToastMessage,
} from "@/components/ui/system-toast";
import { EntriesTable } from "@/modules/entries/components/EntriesTable";
import {
  createWalletListItems,
  type WalletListItem,
} from "@/modules/wallets/view-models/wallet-list-item";
import { WalletTypeBadge } from "./WalletTypeBadge";

type WalletsListProps = {
  readonly categories: readonly Category[];
  readonly initialWallets: readonly WalletListItem[];
};

type WalletForm = {
  readonly name: string;
  readonly type: WalletType;
  readonly initialBalanceCents: number;
  readonly active: boolean;
};

type WalletApiResponse = {
  readonly status?: string;
  readonly wallet?: Wallet;
  readonly error?: string;
};

type EntriesApiResponse = {
  readonly entries?: readonly Entry[];
  readonly error?: string;
};

const statusOptions = ["Ativo", "Inativo"] as const;
type StatusOption = (typeof statusOptions)[number];

const walletStatusMessages: Record<string, string> = {
  created: "Carteira criada com sucesso",
  updated: "Carteira atualizada com sucesso",
  activated: "Carteira ativada com sucesso",
  deactivated: "Carteira inativada com sucesso",
};

export function WalletsList({ categories, initialWallets }: WalletsListProps) {
  const [walletItems, setWalletItems] = useState(() => [...initialWallets]);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null);
  const [walletEntries, setWalletEntries] = useState<readonly Entry[]>([]);
  const [transferEntries, setTransferEntries] = useState<readonly Entry[]>([]);
  const [walletEntriesLoading, setWalletEntriesLoading] = useState(false);
  const [form, setForm] = useState<WalletForm>({
    name: "",
    type: "CASH",
    initialBalanceCents: 0,
    active: true,
  });
  const [search, setSearch] = useState("");
  const [typeFilters, setTypeFilters] = useState<Set<WalletType>>(new Set());
  const [statusFilters, setStatusFilters] = useState<Set<StatusOption>>(
    new Set(),
  );
  const [toast, setToast] = useState<SystemToastMessage | null>(null);
  const [pending, startTransition] = useTransition();
  const addButtonRef = useRef<HTMLButtonElement | null>(null);
  const walletEntriesRequestRef = useRef(0);
  const wallets = walletItems.map((item) => item.wallet);

  const filtered = useMemo(
    () =>
      wallets.filter((wallet) => {
        if (
          search &&
          !wallet.name.toLowerCase().includes(search.trim().toLowerCase())
        ) {
          return false;
        }

        if (typeFilters.size > 0 && !typeFilters.has(wallet.type)) {
          return false;
        }

        if (statusFilters.size > 0) {
          const status = wallet.active ? "Ativo" : "Inativo";

          if (!statusFilters.has(status)) {
            return false;
          }
        }

        return true;
      }),
    [search, statusFilters, typeFilters, wallets],
  );

  const hasFilters =
    search !== "" || typeFilters.size > 0 || statusFilters.size > 0;
  const walletItemById = useMemo(
    () => new Map(walletItems.map((item) => [item.wallet.id, item])),
    [walletItems],
  );

  function showToast(tone: "success" | "error", message: string) {
    setToast({
      id: Date.now(),
      message,
      tone,
    });
  }

  function successMessage(status: string | undefined) {
    return status
      ? walletStatusMessages[status] ?? "Operacao concluida"
      : "Operacao concluida";
  }

  function clearFilters() {
    setSearch("");
    setTypeFilters(new Set());
    setStatusFilters(new Set());
  }

  async function loadWalletEntries(walletId: string) {
    const requestId = ++walletEntriesRequestRef.current;
    setWalletEntriesLoading(true);

    try {
      const [walletResponse, allEntriesResponse] = await Promise.all([
        fetch(`/api/entries?walletIds=${encodeURIComponent(walletId)}`),
        fetch("/api/entries?includeDeleted=false"),
      ]);
      const walletBody = (await walletResponse.json()) as EntriesApiResponse;
      const allEntriesBody = (await allEntriesResponse.json()) as EntriesApiResponse;

      if (requestId !== walletEntriesRequestRef.current) return;

      if (!walletResponse.ok || !allEntriesResponse.ok) {
        showToast(
          "error",
          walletBody.error ??
            allEntriesBody.error ??
            "Nao foi possivel carregar os lancamentos da carteira",
        );
        return;
      }

      const allEntries = allEntriesBody.entries ?? [];
      setWalletEntries(walletBody.entries ?? []);
      setTransferEntries(allEntries);
      setWalletItems((current) =>
        createWalletListItems(
          current.map((item) => item.wallet),
          allEntries,
        ),
      );
    } catch {
      if (requestId === walletEntriesRequestRef.current) {
        showToast("error", "Nao foi possivel carregar os lancamentos da carteira");
      }
    } finally {
      if (requestId === walletEntriesRequestRef.current) {
        setWalletEntriesLoading(false);
      }
    }
  }

  function toggleWalletEntries(walletId: string) {
    if (selectedWalletId === walletId) {
      walletEntriesRequestRef.current += 1;
      setSelectedWalletId(null);
      setWalletEntries([]);
      setTransferEntries([]);
      setWalletEntriesLoading(false);
      return;
    }

    setSelectedWalletId(walletId);
    setWalletEntries([]);
    setTransferEntries([]);
    void loadWalletEntries(walletId);
  }

  function startAdd() {
    setSelectedWalletId(null);
    setEditingId(null);
    setAdding(true);
    setForm({
      name: "",
      type: "CASH",
      initialBalanceCents: 0,
      active: true,
    });
  }

  function cancelAdd() {
    setAdding(false);
    setTimeout(() => addButtonRef.current?.focus(), 0);
  }

  function startEdit(wallet: Wallet) {
    setSelectedWalletId(null);
    setAdding(false);
    setEditingId(wallet.id);
    setForm({
      name: wallet.name,
      type: wallet.type,
      initialBalanceCents: wallet.initialBalanceCents,
      active: wallet.active,
    });
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function saveAdd(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();

    if (!form.name.trim()) {
      return;
    }

    const response = await sendWalletJson("/api/wallets", form);

    if (!response.ok) {
      showToast("error", response.body.error ?? "Nao foi possivel salvar");
      return;
    }

    if (response.body.wallet) {
      const wallet = response.body.wallet as Wallet;
      setWalletItems((current) => [
        ...current,
        {
          wallet,
          entryBalanceCents: 0,
          balanceCents: wallet.initialBalanceCents,
        },
      ]);
    }

    setAdding(false);
    setTimeout(() => addButtonRef.current?.focus(), 0);
    showToast("success", successMessage(response.body.status));
  }

  async function saveEdit(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();

    if (!editingId || !form.name.trim()) {
      return;
    }

    const response = await sendWalletJson(
      `/api/wallets/${editingId}`,
      form,
      "PUT",
    );

    if (!response.ok) {
      showToast("error", response.body.error ?? "Nao foi possivel salvar");
      return;
    }

    if (response.body.wallet) {
      const wallet = response.body.wallet as Wallet;
      setWalletItems((current) =>
        current.map((item) =>
          item.wallet.id === editingId
            ? {
                ...item,
                wallet,
                balanceCents: item.entryBalanceCents + wallet.initialBalanceCents,
              }
            : item,
        ),
      );
    }

    setEditingId(null);
    showToast("success", successMessage(response.body.status));
  }

  async function toggleWallet(wallet: Wallet) {
    const active = !wallet.active;
    const response = await sendWalletJson(
      `/api/wallets/${wallet.id}/active`,
      { active },
      "PATCH",
    );

    if (!response.ok) {
      showToast("error", response.body.error ?? "Nao foi possivel salvar");
      return;
    }

    if (response.body.wallet) {
      const updatedWallet = response.body.wallet as Wallet;
      setWalletItems((current) =>
        current.map((item) =>
          item.wallet.id === wallet.id ? { ...item, wallet: updatedWallet } : item,
        ),
      );
    }

    showToast("success", successMessage(response.body.status));
  }

  return (
    <div className="flex w-full max-w-3xl flex-col gap-4 lg:gap-6">
      {toast ? (
        <SystemToast onDismiss={() => setToast(null)} toast={toast} />
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-40 flex-1">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted"
          />
          <input
            className="h-8 w-full rounded-lg border border-border bg-panel pl-8 pr-8 text-xs text-foreground outline-none transition placeholder:text-muted focus:ring-1 focus:ring-accent"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por nome..."
            value={search}
          />
          {search ? (
            <button
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted transition hover:text-foreground"
              onClick={() => setSearch("")}
              type="button"
            >
              <X className="size-3" aria-hidden="true" />
              <span className="sr-only">Limpar busca</span>
            </button>
          ) : null}
        </div>

        <FilterSelect
          label="Tipo"
          options={walletTypes.map((type) => ({
            value: type,
            label: walletTypeLabels[type],
            content: <WalletTypeBadge type={type} />,
          }))}
          selectedValues={[...typeFilters]}
          onChange={(values) => setTypeFilters(new Set(values))}
        />

        <FilterSelect
          label="Status"
          options={statusOptions.map((status) => ({
            value: status,
            label: status,
          }))}
          selectedValues={[...statusFilters]}
          onChange={(values) => setStatusFilters(new Set(values))}
        />

        {hasFilters ? (
          <button
            className="flex h-8 items-center gap-1 px-2.5 text-[10px] text-muted transition hover:text-foreground"
            onClick={clearFilters}
            type="button"
          >
            <X className="size-3" aria-hidden="true" />
            Limpar
          </button>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        <div className="hidden grid-cols-[1fr_auto_auto_auto_auto] items-center gap-3 border-b border-border bg-panel px-4 py-2 sm:grid">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
            Nome
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
            Tipo
          </span>
          <span className="w-28 text-right text-[10px] font-semibold uppercase tracking-wider text-muted">
            Saldo atual
          </span>
          <span className="w-12 text-center text-[10px] font-semibold uppercase tracking-wider text-muted">
            Status
          </span>
          <span className="w-16" />
        </div>

        <div className="divide-y divide-border bg-panel">
          {filtered.length === 0 && !adding ? (
            <p className="px-4 py-5 text-center text-xs italic text-muted">
              {hasFilters
                ? "Nenhuma carteira corresponde aos filtros."
                : "Nenhuma carteira cadastrada."}
            </p>
          ) : null}

          {filtered.map((wallet) => {
            const walletItem = walletItemById.get(wallet.id);
            const selected = selectedWalletId === wallet.id;

            return (
              <Fragment key={wallet.id}>
                {editingId === wallet.id ? (
                  <WalletFormRow
                    form={form}
                    onCancel={cancelEdit}
                    onChange={setForm}
                    onSave={(event) =>
                      startTransition(() => void saveEdit(event))
                    }
                    pending={pending}
                    submitLabel="Salvar carteira"
                  />
                ) : (
                  <WalletDisplayRow
                    balanceCents={walletItem?.balanceCents ?? wallet.initialBalanceCents}
                    expanded={selected}
                    onEdit={() => startEdit(wallet)}
                    onSelect={() => toggleWalletEntries(wallet.id)}
                    onToggle={() =>
                      startTransition(() => void toggleWallet(wallet))
                    }
                    pending={pending}
                    wallet={wallet}
                  />
                )}

                {selected ? (
                  <WalletEntriesPanel
                    categories={categories}
                    entries={walletEntries}
                    loading={walletEntriesLoading}
                    onEntriesChanged={() => void loadWalletEntries(wallet.id)}
                    transferEntries={transferEntries}
                    wallet={wallet}
                    wallets={wallets.filter((item) => item.active)}
                  />
                ) : null}
              </Fragment>
            );
          })}

          {adding ? (
            <WalletFormRow
              form={form}
              onCancel={cancelAdd}
              onChange={setForm}
              onSave={(event) => startTransition(() => void saveAdd(event))}
              pending={pending}
              submitLabel="Criar carteira"
            />
          ) : (
            <button
              className="flex w-full items-center justify-center gap-1.5 border-t border-dashed border-border py-3 text-xs font-medium text-muted transition hover:bg-surface-elevated/60 hover:text-foreground focus:outline-none focus-visible:ring-1 focus-visible:ring-accent"
              onClick={startAdd}
              ref={addButtonRef}
              type="button"
            >
              <Plus className="size-3.5" aria-hidden="true" />
              Adicionar carteira
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function WalletEntriesPanel({
  categories,
  entries,
  loading,
  onEntriesChanged,
  transferEntries,
  wallet,
  wallets,
}: {
  readonly categories: readonly Category[];
  readonly entries: readonly Entry[];
  readonly loading: boolean;
  readonly onEntriesChanged: () => void;
  readonly transferEntries: readonly Entry[];
  readonly wallet: Wallet;
  readonly wallets: readonly Wallet[];
}) {
  const today = new Date().toISOString().slice(0, 10);

  return (
    <section
      aria-busy={loading}
      aria-label={`Lançamentos da carteira ${wallet.name}`}
      className="border-t border-border bg-surface/30 px-3 py-4 sm:px-4"
    >
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <div>
          <h2 className="text-xs font-semibold text-foreground">
            Lançamentos de {wallet.name}
          </h2>
          <p className="mt-1 text-[11px] text-muted">
            Histórico da carteira com ações de edição, transferência e anexos.
          </p>
        </div>
      </div>

      {loading ? (
        <WalletEntriesSkeleton />
      ) : (
        <EntriesTable
          categories={categories}
          initialEndDate={today}
          initialEntries={entries}
          initialStartDate={today}
          mode="wallet"
          onEntriesChanged={onEntriesChanged}
          transferEntries={transferEntries}
          walletId={wallet.id}
          wallets={wallets}
        />
      )}
    </section>
  );
}

function WalletEntriesSkeleton() {
  return (
    <div
      aria-label="Carregando lançamentos da carteira"
      className="overflow-hidden rounded-xl border border-border bg-panel"
      role="status"
    >
      <div className="hidden grid-cols-[110px_130px_1fr_110px_130px_110px_80px] gap-4 border-b border-border px-4 py-3 md:grid">
        {Array.from({ length: 7 }).map((_, index) => (
          <Skeleton className="h-3" key={index} />
        ))}
      </div>
      <div className="divide-y divide-border">
        {Array.from({ length: 5 }).map((_, rowIndex) => (
          <div
            className="grid gap-3 px-4 py-4 md:grid-cols-[110px_130px_1fr_110px_130px_110px_80px]"
            key={rowIndex}
          >
            {Array.from({ length: 7 }).map((__, columnIndex) => (
              <Skeleton className="h-4" key={columnIndex} />
            ))}
          </div>
        ))}
      </div>
      <span className="sr-only">Carregando lançamentos da carteira...</span>
    </div>
  );
}

function WalletDisplayRow({
  balanceCents,
  expanded,
  onEdit,
  onSelect,
  onToggle,
  pending,
  wallet,
}: {
  readonly balanceCents: number;
  readonly expanded: boolean;
  readonly onEdit: () => void;
  readonly onSelect: () => void;
  readonly onToggle: () => void;
  readonly pending: boolean;
  readonly wallet: Wallet;
}) {
  return (
    <div
      aria-expanded={expanded}
      className={`group grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1 px-4 py-3 transition hover:bg-surface-elevated/50 sm:grid-cols-[1fr_auto_auto_auto_auto] ${
        expanded ? "bg-surface-elevated/50" : ""
      }`}
      onClick={(event) => {
        if (event.target instanceof Element && event.target.closest("button")) {
          return;
        }

        onSelect();
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect();
        }
      }}
      role="button"
      tabIndex={0}
    >
      <div className="min-w-0">
        <span className="block truncate text-xs font-medium text-foreground">
          {wallet.name}
        </span>
        <span className="sm:hidden">
          <WalletTypeBadge type={wallet.type} />
        </span>
      </div>
      <div className="hidden justify-center sm:flex">
        <WalletTypeBadge type={wallet.type} />
      </div>
      <span
        className={`hidden w-28 text-right text-xs font-medium tabular-nums sm:block ${
          balanceCents < 0 ? "text-negative" : "text-foreground"
        }`}
      >
        {formatMoney(balanceCents)}
      </span>
      <div className="hidden w-12 justify-center sm:flex">
        <Switch active={wallet.active} disabled={pending} onToggle={onToggle} />
      </div>
      <div className="flex items-center justify-end gap-1 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
        <IconButton label="Editar carteira" onClick={onEdit} tone="muted">
          <Pencil className="size-3.5" aria-hidden="true" />
        </IconButton>
        <IconButton
          disabled={pending}
          label={wallet.active ? "Inativar carteira" : "Ativar carteira"}
          onClick={onToggle}
          tone={wallet.active ? "negative" : "positive"}
        >
          {wallet.active ? (
            <Trash2 className="size-3.5" aria-hidden="true" />
          ) : (
            <RotateCcw className="size-3.5" aria-hidden="true" />
          )}
        </IconButton>
      </div>
      <div className="col-span-2 flex items-center justify-between pt-0.5 sm:hidden">
        <span
          className={`text-xs font-medium tabular-nums ${
            balanceCents < 0 ? "text-negative" : "text-foreground"
          }`}
        >
          {formatMoney(balanceCents)}
        </span>
        <Switch active={wallet.active} disabled={pending} onToggle={onToggle} />
      </div>
    </div>
  );
}

function WalletFormRow({
  form,
  onCancel,
  onChange,
  onSave,
  pending,
  submitLabel,
}: {
  readonly form: WalletForm;
  readonly onCancel: () => void;
  readonly onChange: (form: WalletForm) => void;
  readonly onSave: (event: FormEvent<HTMLFormElement>) => void;
  readonly pending: boolean;
  readonly submitLabel: string;
}) {
  return (
    <form
      className="flex flex-wrap items-center gap-2 border-l-2 border-l-accent bg-surface-elevated/70 px-4 py-3"
      onSubmit={onSave}
    >
      <input
        autoFocus
        className="min-w-36 flex-1 rounded-md border border-border bg-surface/70 px-3 py-1.5 text-xs text-foreground outline-none placeholder:text-muted focus:ring-1 focus:ring-accent"
        onChange={(event) => onChange({ ...form, name: event.target.value })}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            onCancel();
          }
        }}
        placeholder="Nome da carteira"
        value={form.name}
      />
      <select
        className="h-8 rounded-md border border-border bg-surface/70 px-2.5 text-xs text-foreground outline-none focus:ring-1 focus:ring-accent"
        onChange={(event) =>
          onChange({ ...form, type: event.target.value as WalletType })
        }
        value={form.type}
      >
        {walletTypes.map((type) => (
          <option key={type} value={type}>
            {walletTypeLabels[type]}
          </option>
        ))}
      </select>
      <input
        className="h-8 w-32 rounded-md border border-border bg-surface/70 px-2.5 text-right text-xs text-foreground outline-none focus:ring-1 focus:ring-accent"
        onChange={(event) =>
          onChange({
            ...form,
            initialBalanceCents: Number(event.target.value),
          })
        }
        placeholder="Centavos"
        type="number"
        value={form.initialBalanceCents}
      />
      <div className="flex items-center gap-1.5">
        <Switch
          active={form.active}
          disabled={pending}
          onToggle={() => onChange({ ...form, active: !form.active })}
        />
        <span className="hidden text-[10px] text-muted sm:block">
          {form.active ? "Ativo" : "Inativo"}
        </span>
      </div>
      <IconButton
        disabled={pending}
        label={submitLabel}
        tone="positive"
        type="submit"
      >
        <Check className="size-3.5" aria-hidden="true" />
      </IconButton>
      <IconButton label="Cancelar" onClick={onCancel} tone="muted">
        <X className="size-3.5" aria-hidden="true" />
      </IconButton>
    </form>
  );
}

function Switch({
  active,
  disabled,
  onToggle,
}: {
  readonly active: boolean;
  readonly disabled: boolean;
  readonly onToggle: () => void;
}) {
  return (
    <button
      aria-pressed={active}
      className={`relative h-4 w-8 shrink-0 rounded-full transition ${
        active ? "bg-positive" : "bg-surface-elevated"
      } disabled:opacity-60`}
      disabled={disabled}
      onClick={onToggle}
      type="button"
    >
      <span
        className={`absolute left-0.5 top-0.5 size-3 rounded-full bg-white shadow transition-transform ${
          active ? "translate-x-4" : "translate-x-0"
        }`}
      />
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
      type={type}
    >
      {children}
      <span className="sr-only">{label}</span>
    </button>
  );
}

function formatMoney(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    currency: "BRL",
    style: "currency",
  }).format(cents / 100);
}

async function sendWalletJson(
  url: string,
  body: unknown,
  method = "POST",
): Promise<{ ok: boolean; body: WalletApiResponse }> {
  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  return {
    ok: response.ok,
    body: (await response.json()) as WalletApiResponse,
  };
}
