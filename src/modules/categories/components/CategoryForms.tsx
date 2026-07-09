"use client";

import {
  FormEvent,
  ReactNode,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Check,
  GripVertical,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
  X,
} from "lucide-react";
import type { Category, CategoryType } from "@/domain/category/category";

type CategoryGroupsProps = {
  readonly initialCategories: readonly Category[];
};

type EditingState = {
  readonly id: string;
  readonly name: string;
  readonly active: boolean;
};

type CreateState = {
  readonly type: CategoryType;
  readonly name: string;
  readonly active: boolean;
};

type CategoryApiResponse = {
  readonly status?: string;
  readonly error?: string;
};

const groupConfig = [
  {
    type: "INCOME",
    label: "Receitas",
    icon: ArrowUpCircle,
    tone: "positive",
  },
  {
    type: "EXPENSE",
    label: "Despesas",
    icon: ArrowDownCircle,
    tone: "negative",
  },
] as const;

export function CategoryGroups({ initialCategories }: CategoryGroupsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [categories, setCategories] = useState(() => [...initialCategories]);
  const [adding, setAdding] = useState<CreateState | null>(null);
  const [editing, setEditing] = useState<EditingState | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverType, setDragOverType] = useState<CategoryType | null>(null);
  const [pending, startTransition] = useTransition();
  const addButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const grouped = useMemo(
    () => ({
      INCOME: categories.filter((category) => category.type === "INCOME"),
      EXPENSE: categories.filter((category) => category.type === "EXPENSE"),
    }),
    [categories],
  );

  function startAdd(type: CategoryType) {
    setEditing(null);
    setAdding({ type, name: "", active: true });
  }

  function startEdit(category: Category) {
    setAdding(null);
    setEditing({
      id: category.id,
      name: category.name,
      active: category.active,
    });
  }

  function cancelForm() {
    const type = adding?.type;
    setAdding(null);
    setEditing(null);

    if (type) {
      setTimeout(() => addButtonRefs.current[type]?.focus(), 0);
    }
  }

  function updateLocalCategory(
    id: string,
    values: Pick<Category, "active" | "name" | "type">,
  ) {
    setCategories((current) =>
      current.map((category) =>
        category.id === id ? { ...category, ...values } : category,
      ),
    );
  }

  function navigateWithMessage(key: "status" | "error", value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("status");
    params.delete("error");
    params.set(key, value);

    router.push(`/categories?${params.toString()}`);
    router.refresh();
  }

  async function saveAdd(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();

    if (!adding?.name.trim()) {
      return;
    }

    const current = adding;
    const response = await postJson("/api/categories", {
      name: current.name,
      type: current.type,
    });

    if (!response.ok) {
      navigateWithMessage(
        "error",
        response.body.error ?? "Nao foi possivel salvar a categoria",
      );
      return;
    }

    setAdding(null);
    navigateWithMessage("status", "created");
  }

  async function saveEdit(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();

    if (!editing?.name.trim()) {
      return;
    }

    const category = categories.find((item) => item.id === editing.id);

    if (!category) {
      return;
    }

    const values = {
      name: editing.name,
      type: category.type,
      active: editing.active,
    };
    const response = await postJson(
      `/api/categories/${category.id}`,
      values,
      "PUT",
    );

    if (!response.ok) {
      navigateWithMessage(
        "error",
        response.body.error ?? "Nao foi possivel salvar a categoria",
      );
      return;
    }

    updateLocalCategory(category.id, values);
    setEditing(null);
    navigateWithMessage("status", "updated");
  }

  async function toggleCategory(category: Category) {
    const active = !category.active;
    const response = await postJson(
      `/api/categories/${category.id}/active`,
      { active },
      "PATCH",
    );

    if (!response.ok) {
      navigateWithMessage(
        "error",
        response.body.error ?? "Nao foi possivel salvar a categoria",
      );
      return;
    }

    updateLocalCategory(category.id, {
      active,
      name: category.name,
      type: category.type,
    });
    navigateWithMessage("status", active ? "activated" : "deactivated");
  }

  async function moveCategory(category: Category, type: CategoryType) {
    if (category.type === type) {
      return;
    }

    const values = {
      name: category.name,
      type,
      active: category.active,
    };
    const response = await postJson(
      `/api/categories/${category.id}`,
      values,
      "PUT",
    );

    if (!response.ok) {
      navigateWithMessage(
        "error",
        response.body.error ?? "Nao foi possivel mover a categoria",
      );
      return;
    }

    updateLocalCategory(category.id, values);
    navigateWithMessage("status", "updated");
  }

  function handleDrop(type: CategoryType) {
    const category = categories.find((item) => item.id === draggingId);
    setDraggingId(null);
    setDragOverType(null);

    if (!category) {
      return;
    }

    startTransition(() => void moveCategory(category, type));
  }

  return (
    <div className="flex w-full max-w-3xl flex-col gap-4 lg:gap-6">
      {draggingId ? (
        <p className="text-center text-[10px] text-accent">
          Solte sobre o grupo para mover a categoria.
        </p>
      ) : null}

      {groupConfig.map(({ icon: Icon, label, tone, type }) => {
        const items = grouped[type];
        const isDragTarget = dragOverType === type && draggingId !== null;
        const draggingCategory = categories.find((item) => item.id === draggingId);
        const isAlreadyInGroup = draggingCategory?.type === type;
        const toneClasses =
          tone === "positive"
            ? {
                header: "bg-positive/5",
                activeHeader: "bg-positive/15",
                border: "border-positive ring-2 ring-positive/30",
                icon: "text-positive",
              }
            : {
                header: "bg-negative/5",
                activeHeader: "bg-negative/15",
                border: "border-negative ring-2 ring-negative/30",
                icon: "text-negative",
              };

        return (
          <section
            className={`overflow-hidden rounded-xl border transition-all ${
              isDragTarget && !isAlreadyInGroup ? toneClasses.border : "border-border"
            }`}
            key={type}
            onDragLeave={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node)) {
                setDragOverType(null);
              }
            }}
            onDragOver={(event) => {
              event.preventDefault();
              setDragOverType(type);
            }}
            onDrop={(event) => {
              event.preventDefault();
              handleDrop(type);
            }}
          >
            <header
              className={`flex items-center justify-between border-b border-border px-5 py-3 transition-colors ${
                isDragTarget && !isAlreadyInGroup
                  ? toneClasses.activeHeader
                  : toneClasses.header
              }`}
            >
              <div className="flex items-center gap-2">
                <Icon className={`size-4 ${toneClasses.icon}`} aria-hidden="true" />
                <span className="text-sm font-semibold">{label}</span>
                <span className="rounded-full bg-surface-elevated px-2 py-0.5 text-[10px] font-medium text-muted">
                  {items.length}
                </span>
              </div>
            </header>

            <div
              className={`divide-y divide-border ${
                isDragTarget && !isAlreadyInGroup ? "bg-surface-elevated/70" : "bg-panel"
              }`}
            >
              {items.length === 0 && adding?.type !== type && !isDragTarget ? (
                <p className="px-5 py-4 text-xs italic text-muted">
                  Nenhuma categoria cadastrada.
                </p>
              ) : null}

              {items.map((category) =>
                editing?.id === category.id ? (
                  <EditCategoryRow
                    editing={editing}
                    key={category.id}
                    onCancel={cancelForm}
                    onChange={setEditing}
                    onSave={(event) =>
                      startTransition(() => void saveEdit(event))
                    }
                    pending={pending}
                  />
                ) : (
                  <CategoryDisplayRow
                    category={category}
                    key={category.id}
                    onDeactivate={() =>
                      startTransition(() => void toggleCategory(category))
                    }
                    onDragEnd={() => {
                      setDraggingId(null);
                      setDragOverType(null);
                    }}
                    onDragStart={() => setDraggingId(category.id)}
                    onEdit={() => startEdit(category)}
                    pending={pending}
                  />
                ),
              )}

              {adding?.type === type ? (
                <CreateCategoryRow
                  adding={adding}
                  onCancel={cancelForm}
                  onChange={setAdding}
                  onSave={(event) => startTransition(() => void saveAdd(event))}
                  pending={pending}
                />
              ) : (
                <button
                  className="flex w-full items-center justify-center gap-1.5 border-t border-dashed border-border py-3 text-xs font-medium text-muted transition hover:bg-surface-elevated/60 hover:text-foreground focus:outline-none focus-visible:ring-1 focus-visible:ring-accent"
                  onClick={() => startAdd(type)}
                  ref={(element) => {
                    addButtonRefs.current[type] = element;
                  }}
                  type="button"
                >
                  <Plus className="size-3.5" aria-hidden="true" />
                  Adicionar categoria
                </button>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function CategoryDisplayRow({
  category,
  onDeactivate,
  onDragEnd,
  onDragStart,
  onEdit,
  pending,
}: {
  readonly category: Category;
  readonly onDeactivate: () => void;
  readonly onDragEnd: () => void;
  readonly onDragStart: () => void;
  readonly onEdit: () => void;
  readonly pending: boolean;
}) {
  return (
    <div
      className="group flex cursor-grab items-center gap-2 px-4 py-3 transition hover:bg-surface-elevated/50 active:cursor-grabbing"
      draggable
      onDragEnd={onDragEnd}
      onDragStart={onDragStart}
    >
      <GripVertical className="size-3.5 shrink-0 text-muted/45 transition group-hover:text-muted" aria-hidden="true" />
      <span className="min-w-0 flex-1 truncate text-xs">{category.name}</span>
      <span
        className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
          category.active
            ? "bg-positive/10 text-positive"
            : "bg-surface-elevated text-muted"
        }`}
      >
        {category.active ? "Ativo" : "Inativo"}
      </span>
      <div className="flex items-center gap-1 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
        <button
          className="flex size-7 items-center justify-center rounded-md text-muted transition hover:bg-surface-elevated hover:text-foreground"
          onClick={onEdit}
          type="button"
        >
          <Pencil className="size-3.5" aria-hidden="true" />
          <span className="sr-only">Editar categoria</span>
        </button>
        <button
          className="flex size-7 items-center justify-center rounded-md text-muted transition hover:bg-negative/10 hover:text-negative disabled:opacity-60"
          disabled={pending}
          onClick={onDeactivate}
          type="button"
        >
          {category.active ? (
            <Trash2 className="size-3.5" aria-hidden="true" />
          ) : (
            <RotateCcw className="size-3.5" aria-hidden="true" />
          )}
          <span className="sr-only">
            {category.active ? "Inativar categoria" : "Ativar categoria"}
          </span>
        </button>
      </div>
    </div>
  );
}

function EditCategoryRow({
  editing,
  onCancel,
  onChange,
  onSave,
  pending,
}: {
  readonly editing: EditingState;
  readonly onCancel: () => void;
  readonly onChange: (state: EditingState) => void;
  readonly onSave: (event: FormEvent<HTMLFormElement>) => void;
  readonly pending: boolean;
}) {
  return (
    <form
      className="flex items-center gap-2 bg-surface-elevated/70 px-4 py-3"
      onSubmit={onSave}
    >
      <GripVertical className="size-3.5 shrink-0 text-muted/40" aria-hidden="true" />
      <input
        autoFocus
        className="min-w-0 flex-1 rounded-md border border-border bg-surface/70 px-3 py-1.5 text-xs text-foreground outline-none placeholder:text-muted focus:ring-1 focus:ring-accent"
        onChange={(event) =>
          onChange({ ...editing, name: event.target.value })
        }
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            onCancel();
          }
        }}
        placeholder="Nome da categoria"
        value={editing.name}
      />
      <Switch
        active={editing.active}
        disabled={pending}
        onToggle={() => onChange({ ...editing, active: !editing.active })}
      />
      <span className="hidden text-[10px] text-muted sm:block">
        {editing.active ? "Ativo" : "Inativo"}
      </span>
      <IconButton disabled={pending} label="Salvar categoria" tone="positive" type="submit">
        <Check className="size-3.5" aria-hidden="true" />
      </IconButton>
      <IconButton label="Cancelar" onClick={onCancel} tone="muted" type="button">
        <X className="size-3.5" aria-hidden="true" />
      </IconButton>
    </form>
  );
}

function CreateCategoryRow({
  adding,
  onCancel,
  onChange,
  onSave,
  pending,
}: {
  readonly adding: CreateState;
  readonly onCancel: () => void;
  readonly onChange: (state: CreateState) => void;
  readonly onSave: (event: FormEvent<HTMLFormElement>) => void;
  readonly pending: boolean;
}) {
  return (
    <form
      className="flex items-center gap-2 bg-surface-elevated/70 px-5 py-3"
      onSubmit={onSave}
    >
      <input
        autoFocus
        className="min-w-0 flex-1 rounded-md border border-border bg-surface/70 px-3 py-1.5 text-xs text-foreground outline-none placeholder:text-muted focus:ring-1 focus:ring-accent"
        onChange={(event) => onChange({ ...adding, name: event.target.value })}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            onCancel();
          }
        }}
        placeholder="Nome da categoria"
        value={adding.name}
      />
      <Switch
        active={adding.active}
        disabled={pending}
        onToggle={() => onChange({ ...adding, active: !adding.active })}
      />
      <span className="hidden text-[10px] text-muted sm:block">
        {adding.active ? "Ativo" : "Inativo"}
      </span>
      <IconButton disabled={pending} label="Criar categoria" tone="positive" type="submit">
        <Check className="size-3.5" aria-hidden="true" />
      </IconButton>
      <IconButton label="Cancelar" onClick={onCancel} tone="muted" type="button">
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
  type,
}: {
  readonly children: ReactNode;
  readonly disabled?: boolean;
  readonly label: string;
  readonly onClick?: () => void;
  readonly tone: "muted" | "positive";
  readonly type: "button" | "submit";
}) {
  return (
    <button
      className={`flex size-7 shrink-0 items-center justify-center rounded-md transition disabled:opacity-60 ${
        tone === "positive"
          ? "bg-positive/15 text-positive hover:bg-positive/25"
          : "bg-surface text-muted hover:text-foreground"
      }`}
      disabled={disabled}
      onClick={onClick}
      type={type}
    >
      {children}
      <span className="sr-only">{label}</span>
    </button>
  );
}

async function postJson(
  url: string,
  body: unknown,
  method = "POST",
): Promise<{ ok: boolean; body: CategoryApiResponse }> {
  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  return {
    ok: response.ok,
    body: (await response.json()) as CategoryApiResponse,
  };
}
