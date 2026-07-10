"use client";

import {
  FormEvent,
  ReactNode,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { Check, Pencil, Plus, RotateCcw, Search, Trash2, X } from "lucide-react";
import type { Wallet, WalletType } from "@/domain/wallet/wallet";
import { walletTypeLabels, walletTypes } from "@/domain/wallet/wallet";
import {
  SystemToast,
  type SystemToastMessage,
} from "@/components/ui/system-toast";
import { WalletTypeBadge } from "./WalletTypeBadge";

type WalletsListProps = {
  readonly initialWallets: readonly Wallet[];
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

const statusOptions = ["Ativo", "Inativo"] as const;
type StatusOption = (typeof statusOptions)[number];

const walletStatusMessages: Record<string, string> = {
  created: "Carteira criada com sucesso",
  updated: "Carteira atualizada com sucesso",
  activated: "Carteira ativada com sucesso",
  deactivated: "Carteira inativada com sucesso",
};

export function WalletsList({ initialWallets }: WalletsListProps) {
  const [wallets, setWallets] = useState(() => [...initialWallets]);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
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

  function startAdd() {
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
      setWallets((current) => [...current, response.body.wallet as Wallet]);
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
      setWallets((current) =>
        current.map((wallet) =>
          wallet.id === editingId ? (response.body.wallet as Wallet) : wallet,
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
      setWallets((current) =>
        current.map((item) =>
          item.id === wallet.id ? (response.body.wallet as Wallet) : item,
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

        <FilterMenu
          label="Tipo"
          selectedCount={typeFilters.size}
          options={walletTypes}
          selected={typeFilters}
          onChange={setTypeFilters}
          renderOption={(type) => <WalletTypeBadge type={type} />}
        />

        <FilterMenu
          label="Status"
          selectedCount={statusFilters.size}
          options={statusOptions}
          selected={statusFilters}
          onChange={setStatusFilters}
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
            Saldo inicial
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

          {filtered.map((wallet) =>
            editingId === wallet.id ? (
              <WalletFormRow
                form={form}
                key={wallet.id}
                onCancel={cancelEdit}
                onChange={setForm}
                onSave={(event) => startTransition(() => void saveEdit(event))}
                pending={pending}
                submitLabel="Salvar carteira"
              />
            ) : (
              <WalletDisplayRow
                key={wallet.id}
                onEdit={() => startEdit(wallet)}
                onToggle={() =>
                  startTransition(() => void toggleWallet(wallet))
                }
                pending={pending}
                wallet={wallet}
              />
            ),
          )}

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

function WalletDisplayRow({
  onEdit,
  onToggle,
  pending,
  wallet,
}: {
  readonly onEdit: () => void;
  readonly onToggle: () => void;
  readonly pending: boolean;
  readonly wallet: Wallet;
}) {
  return (
    <div className="group grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1 px-4 py-3 transition hover:bg-surface-elevated/50 sm:grid-cols-[1fr_auto_auto_auto_auto]">
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
          wallet.initialBalanceCents < 0 ? "text-negative" : "text-foreground"
        }`}
      >
        {formatMoney(wallet.initialBalanceCents)}
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
            wallet.initialBalanceCents < 0 ? "text-negative" : "text-foreground"
          }`}
        >
          {formatMoney(wallet.initialBalanceCents)}
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

function FilterMenu<T extends string>({
  label,
  onChange,
  options,
  renderOption,
  selected,
  selectedCount,
}: {
  readonly label: string;
  readonly onChange: (selected: Set<T>) => void;
  readonly options: readonly T[];
  readonly renderOption?: (option: T) => ReactNode;
  readonly selected: Set<T>;
  readonly selectedCount: number;
}) {
  const [open, setOpen] = useState(false);

  function toggle(option: T) {
    const next = new Set(selected);

    if (next.has(option)) {
      next.delete(option);
    } else {
      next.add(option);
    }

    onChange(next);
  }

  return (
    <div className="relative">
      <button
        className="flex h-8 items-center gap-1 rounded-lg border border-border bg-panel px-2.5 text-xs text-foreground transition hover:bg-surface-elevated"
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        {label}
        {selectedCount > 0 ? (
          <span className="rounded-full bg-accent/20 px-1.5 text-[10px] text-accent">
            {selectedCount}
          </span>
        ) : null}
      </button>
      {open ? (
        <>
          <button
            aria-label="Fechar filtro"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
            type="button"
          />
          <div className="absolute right-0 z-50 mt-1 min-w-44 rounded-lg border border-border bg-surface p-1 shadow-2xl">
            {options.map((option) => (
              <button
                className="flex w-full items-center justify-between gap-3 rounded-md px-2 py-1.5 text-left text-xs transition hover:bg-surface-elevated"
                key={option}
                onClick={() => toggle(option)}
                type="button"
              >
                <span>{renderOption ? renderOption(option) : option}</span>
                {selected.has(option) ? (
                  <Check className="size-3 text-accent" aria-hidden="true" />
                ) : null}
              </button>
            ))}
          </div>
        </>
      ) : null}
    </div>
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
