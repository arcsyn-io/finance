"use client";

import type { FormEvent, ReactNode } from "react";
import {
  ArrowLeftRight,
  Check,
  Paperclip,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
  X,
} from "lucide-react";
import { CalendarField } from "@/components/ui/CalendarField";
import { CurrencyField } from "@/components/ui/CurrencyField";
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
import type { Wallet } from "@/domain/wallet/wallet";
import { CategoryBadge } from "@/modules/categories/components/CategoryBadge";
import type { EntryForm } from "@/modules/entries/view-models/entry-form";
import { createMobileEntryViewModel } from "@/modules/entries/view-models/entry-mobile-view-model";

type EntriesMobileListProps = {
  readonly adding: boolean;
  readonly categories: readonly Category[];
  readonly editingId: string | null;
  readonly entries: readonly Entry[];
  readonly errorRow: "add" | string | null;
  readonly form: EntryForm;
  readonly onAttachments: (entry: Entry) => void;
  readonly onCancel: () => void;
  readonly onChangeForm: (form: EntryForm) => void;
  readonly onDelete: (entry: Entry) => void;
  readonly onEdit: (entry: Entry) => void;
  readonly onRestore: (entry: Entry) => void;
  readonly onSaveAdd: (event: FormEvent<HTMLFormElement>) => void;
  readonly onSaveEdit: (event: FormEvent<HTMLFormElement>) => void;
  readonly onStartAdd: () => void;
  readonly onTransfer: (entry: Entry) => void;
  readonly pending: boolean;
  readonly savingRow: "add" | string | null;
  readonly wallets: readonly Wallet[];
};

export function EntriesMobileList({
  adding,
  categories,
  editingId,
  entries,
  errorRow,
  form,
  onAttachments,
  onCancel,
  onChangeForm,
  onDelete,
  onEdit,
  onRestore,
  onSaveAdd,
  onSaveEdit,
  onStartAdd,
  onTransfer,
  pending,
  savingRow,
  wallets,
}: EntriesMobileListProps) {
  const categoriesById = new Map(categories.map((category) => [category.id, category]));

  return (
    <section aria-label="Lista de transações" className="md:hidden">
      <div className="overflow-hidden rounded-xl border border-border bg-panel">
        {entries.length === 0 && !adding ? (
          <p className="px-4 py-8 text-center text-xs italic text-muted">
            Nenhuma transação encontrada.
          </p>
        ) : null}

        <div className="divide-y divide-border">
          {entries.map((entry) => {
            if (editingId === entry.id) {
              return savingRow === entry.id ? (
                <MobileEntrySkeleton key={entry.id} />
              ) : (
                <MobileEntryForm
                  categories={categories}
                  form={form}
                  hasError={errorRow === entry.id}
                  key={entry.id}
                  onCancel={onCancel}
                  onChange={onChangeForm}
                  onSave={onSaveEdit}
                  pending={pending}
                  title="Editar transação"
                  wallets={wallets}
                />
              );
            }

            return (
              <MobileEntryCard
                category={entry.categoryId ? categoriesById.get(entry.categoryId) : undefined}
                entry={entry}
                key={entry.id}
                onAttachments={() => onAttachments(entry)}
                onDelete={() => onDelete(entry)}
                onEdit={() => onEdit(entry)}
                onRestore={() => onRestore(entry)}
                onTransfer={() => onTransfer(entry)}
                pending={pending}
              />
            );
          })}

          {adding ? (
            savingRow === "add" ? (
              <MobileEntrySkeleton />
            ) : (
              <MobileEntryForm
                categories={categories}
                form={form}
                hasError={errorRow === "add"}
                onCancel={onCancel}
                onChange={onChangeForm}
                onSave={onSaveAdd}
                pending={pending}
                title="Adicionar transação"
                wallets={wallets}
              />
            )
          ) : null}
        </div>

        {!adding ? (
          <button
            className="flex min-h-11 w-full items-center justify-center gap-2 border-t border-dashed border-border px-4 py-3 text-xs font-semibold text-muted transition hover:bg-surface-elevated hover:text-foreground focus:outline-none focus-visible:ring-1 focus-visible:ring-accent"
            onClick={onStartAdd}
            type="button"
          >
            <Plus className="size-4" aria-hidden="true" />
            Adicionar transação
          </button>
        ) : null}
      </div>
    </section>
  );
}

function MobileEntryCard({
  category,
  entry,
  onAttachments,
  onDelete,
  onEdit,
  onRestore,
  onTransfer,
  pending,
}: {
  readonly category?: Category;
  readonly entry: Entry;
  readonly onAttachments: () => void;
  readonly onDelete: () => void;
  readonly onEdit: () => void;
  readonly onRestore: () => void;
  readonly onTransfer: () => void;
  readonly pending: boolean;
}) {
  const viewModel = createMobileEntryViewModel(entry);
  const deleted = Boolean(entry.deletedAt);

  return (
    <article className={`px-4 py-3.5 ${deleted ? "opacity-45" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] tabular-nums text-muted">
            {formatDate(viewModel.occurredOn)}
          </p>
          <div className="mt-1.5">
            {category ? (
              <CategoryBadge color={category.color} icon={category.icon} name={category.name} />
            ) : (
              <span className="text-xs text-muted">{viewModel.categoryName}</span>
            )}
          </div>
        </div>
        <p
          className={`shrink-0 text-sm font-bold tabular-nums ${
            viewModel.signedAmountCents < 0 ? "text-negative" : "text-positive"
          }`}
        >
          {viewModel.signedAmountCents >= 0 ? "+" : ""}
          {formatMoney(viewModel.signedAmountCents)}
        </p>
      </div>

      {viewModel.description ? (
        <p className={`mt-2 truncate text-xs text-foreground ${deleted ? "line-through" : ""}`}>
          {viewModel.description}
        </p>
      ) : null}

      <div className="mt-3 flex items-center gap-1 border-t border-border/70 pt-2">
        {deleted ? (
          <MobileActionButton
            disabled={pending}
            label={viewModel.actionLabels[0]}
            onClick={onRestore}
            tone="positive"
          >
            <RotateCcw className="size-4" aria-hidden="true" />
          </MobileActionButton>
        ) : (
          <>
            <MobileActionButton disabled={pending} label={viewModel.actionLabels[0]} onClick={onEdit}>
              <Pencil className="size-4" aria-hidden="true" />
            </MobileActionButton>
            <MobileActionButton
              disabled={pending}
              label={viewModel.actionLabels[1]}
              onClick={onDelete}
              tone="negative"
            >
              <Trash2 className="size-4" aria-hidden="true" />
            </MobileActionButton>
            <MobileActionButton disabled={pending} label={viewModel.actionLabels[2]} onClick={onTransfer}>
              <ArrowLeftRight className="size-4" aria-hidden="true" />
            </MobileActionButton>
          </>
        )}
        <MobileActionButton
          badge={entry.attachmentCount}
          disabled={pending}
          label={viewModel.actionLabels.at(-1) ?? "Abrir anexos"}
          onClick={onAttachments}
        >
          <Paperclip className="size-4" aria-hidden="true" />
        </MobileActionButton>
      </div>
    </article>
  );
}

function MobileActionButton({
  badge,
  children,
  disabled,
  label,
  onClick,
  tone = "default",
}: {
  readonly badge?: number;
  readonly children: ReactNode;
  readonly disabled: boolean;
  readonly label: string;
  readonly onClick: () => void;
  readonly tone?: "default" | "positive" | "negative";
}) {
  const toneClass =
    tone === "positive"
      ? "text-positive hover:bg-positive/15"
      : tone === "negative"
        ? "text-negative hover:bg-negative/15"
        : "text-muted hover:bg-surface hover:text-foreground";

  return (
    <button
      aria-label={label}
      className={`relative flex size-11 items-center justify-center rounded-lg transition focus:outline-none focus-visible:ring-1 focus-visible:ring-accent disabled:opacity-50 ${toneClass}`}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {children}
      {badge ? (
        <span className="absolute right-1 top-1 flex min-w-4 items-center justify-center rounded-full bg-positive px-1 text-[9px] font-bold text-background">
          {badge > 9 ? "9+" : badge}
        </span>
      ) : null}
    </button>
  );
}

function MobileEntryForm({
  categories,
  form,
  hasError,
  onCancel,
  onChange,
  onSave,
  pending,
  title,
  wallets,
}: {
  readonly categories: readonly Category[];
  readonly form: EntryForm;
  readonly hasError: boolean;
  readonly onCancel: () => void;
  readonly onChange: (form: EntryForm) => void;
  readonly onSave: (event: FormEvent<HTMLFormElement>) => void;
  readonly pending: boolean;
  readonly title: string;
  readonly wallets: readonly Wallet[];
}) {
  return (
    <form
      className={`space-y-3 px-4 py-4 ${hasError ? "bg-negative/10" : "bg-surface-elevated/60"}`}
      onSubmit={onSave}
    >
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      <MobileField label="Data">
        <CalendarField
          label="Data da transação"
          onChange={(occurredOn) => onChange({ ...form, occurredOn })}
          value={form.occurredOn}
        />
      </MobileField>
      <MobileField label="Categoria">
        <select aria-label="Categoria" className={mobileInputClass} onChange={(event) => onChange({ ...form, categoryId: event.target.value })} value={form.categoryId}>
          {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
        </select>
      </MobileField>
      <MobileField label="Valor">
        <CurrencyField
          aria-label="Valor"
          className="h-10"
          onValueInCentsChange={(amountCents) => onChange({ ...form, amountCents })}
          valueInCents={form.amountCents}
        />
      </MobileField>
      <MobileField label="Descrição">
        <input aria-label="Descrição" className={mobileInputClass} onChange={(event) => onChange({ ...form, description: event.target.value })} placeholder="Descrição" value={form.description} />
      </MobileField>
      <MobileField label="Carteira">
        <select aria-label="Carteira" className={mobileInputClass} onChange={(event) => onChange({ ...form, walletId: event.target.value })} value={form.walletId}>
          {wallets.map((wallet) => <option key={wallet.id} value={wallet.id}>{wallet.name}</option>)}
        </select>
      </MobileField>
      <MobileField label="Natureza">
        <select aria-label="Natureza" className={mobileInputClass} onChange={(event) => onChange({ ...form, nature: event.target.value as EntryNature })} value={form.nature}>
          {entryNatures.map((nature) => <option key={nature} value={nature}>{entryNatureLabels[nature]}</option>)}
        </select>
      </MobileField>
      <MobileField label="Evento econômico">
        <select aria-label="Evento econômico" className={mobileInputClass} onChange={(event) => onChange({ ...form, economicEvent: event.target.value as EconomicEvent | "" })} value={form.economicEvent}>
          <option value="">Inferir automaticamente</option>
          {economicEvents.map((event) => <option key={event} value={event}>{economicEventLabels[event]}</option>)}
        </select>
      </MobileField>
      <div className="flex justify-end gap-2 pt-1">
        <button className="flex h-11 items-center gap-2 rounded-lg border border-border px-4 text-xs font-semibold text-foreground transition hover:bg-surface" onClick={onCancel} type="button">
          <X className="size-4" aria-hidden="true" />
          Cancelar
        </button>
        <button className="flex h-11 items-center gap-2 rounded-lg bg-positive px-4 text-xs font-bold text-background transition hover:bg-positive/90 disabled:opacity-60" disabled={pending} type="submit">
          <Check className="size-4" aria-hidden="true" />
          Salvar
        </button>
      </div>
    </form>
  );
}

function MobileField({ children, label }: { readonly children: ReactNode; readonly label: string }) {
  return <div className="grid gap-1.5 text-[11px] font-medium text-muted"><span>{label}</span>{children}</div>;
}

function MobileEntrySkeleton() {
  return <div className="space-y-3 px-4 py-4"><div className="h-3 w-20 animate-pulse rounded bg-surface" /><div className="h-5 w-28 animate-pulse rounded bg-surface" /><div className="h-11 animate-pulse rounded bg-surface" /></div>;
}

const mobileInputClass = "h-10 w-full rounded-md border border-border bg-surface/70 px-2.5 text-xs text-foreground outline-none focus:ring-1 focus:ring-accent";

function formatMoney(cents: number): string {
  return new Intl.NumberFormat("pt-BR", { currency: "BRL", style: "currency" }).format(cents / 100);
}

function formatDate(value: string): string {
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}
