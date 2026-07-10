"use client";

import {
  FormEvent,
  ReactNode,
  useCallback,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { createPortal } from "react-dom";
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
import {
  SystemToast,
  type SystemToastMessage,
} from "@/components/ui/system-toast";
import type { Category, CategoryType } from "@/domain/category/category";
import {
  defaultCategoryColor,
  defaultCategoryIcon,
  expenseCategoryColors,
  incomeCategoryColors,
} from "@/domain/category/category-visual";
import {
  CategoryBadge,
  categoryIconMap,
  categoryIconOptions,
} from "./CategoryBadge";

type CategoryGroupsProps = {
  readonly initialCategories: readonly Category[];
  readonly includeInactive: boolean;
};

type EditingState = {
  readonly id: string;
  readonly name: string;
  readonly icon: string;
  readonly color: string;
  readonly active: boolean;
};

type CreateState = {
  readonly type: CategoryType;
  readonly name: string;
  readonly icon: string;
  readonly color: string;
  readonly active: boolean;
};

type CategoryApiResponse = {
  readonly status?: string;
  readonly category?: Category;
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

const categoryStatusMessages: Record<string, string> = {
  created: "Categoria criada com sucesso",
  updated: "Categoria atualizada com sucesso",
  activated: "Categoria ativada com sucesso",
  deactivated: "Categoria desativada com sucesso",
};

export function CategoryGroups({
  includeInactive,
  initialCategories,
}: CategoryGroupsProps) {
  const [categories, setCategories] = useState(() => [...initialCategories]);
  const [adding, setAdding] = useState<CreateState | null>(null);
  const [editing, setEditing] = useState<EditingState | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverType, setDragOverType] = useState<CategoryType | null>(null);
  const [toast, setToast] = useState<SystemToastMessage | null>(null);
  const [pending, startTransition] = useTransition();
  const addButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const dismissToast = useCallback(() => setToast(null), []);

  const grouped = useMemo(
    () => ({
      INCOME: categories.filter((category) => category.type === "INCOME"),
      EXPENSE: categories.filter((category) => category.type === "EXPENSE"),
    }),
    [categories],
  );

  function startAdd(type: CategoryType) {
    setEditing(null);
    setAdding({
      type,
      name: "",
      icon: defaultCategoryIcon,
      color: defaultCategoryColor(type),
      active: true,
    });
  }

  function startEdit(category: Category) {
    setAdding(null);
    setEditing({
      id: category.id,
      name: category.name,
      icon: category.icon,
      color: category.color,
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
    values: Pick<Category, "active" | "color" | "icon" | "name" | "type">,
  ) {
    setCategories((current) =>
      current.map((category) =>
        category.id === id ? { ...category, ...values } : category,
      ),
    );
  }

  function showToast(tone: "success" | "error", message: string) {
    setToast({
      id: Date.now(),
      message,
      tone,
    });
  }

  function successMessage(status: string | undefined) {
    return status
      ? categoryStatusMessages[status] ?? "Operacao concluida"
      : "Operacao concluida";
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
      icon: current.icon,
      color: current.color,
      active: current.active,
    });

    if (!response.ok) {
      showToast(
        "error",
        response.body.error ?? "Nao foi possivel salvar a categoria",
      );
      return;
    }

    if (response.body.category && (response.body.category.active || includeInactive)) {
      setCategories((currentCategories) => [
        ...currentCategories,
        response.body.category as Category,
      ]);
    }

    setAdding(null);
    showToast("success", successMessage(response.body.status));
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
      icon: editing.icon,
      color: editing.color,
      active: editing.active,
    };
    const response = await postJson(
      `/api/categories/${category.id}`,
      values,
      "PUT",
    );

    if (!response.ok) {
      showToast(
        "error",
        response.body.error ?? "Nao foi possivel salvar a categoria",
      );
      return;
    }

    updateLocalCategory(category.id, values);
    setEditing(null);
    showToast("success", successMessage(response.body.status));
  }

  async function toggleCategory(category: Category) {
    const active = !category.active;
    const response = await postJson(
      `/api/categories/${category.id}/active`,
      { active },
      "PATCH",
    );

    if (!response.ok) {
      showToast(
        "error",
        response.body.error ?? "Nao foi possivel salvar a categoria",
      );
      return;
    }

    if (!active && !includeInactive) {
      setCategories((currentCategories) =>
        currentCategories.filter((item) => item.id !== category.id),
      );
    } else {
      updateLocalCategory(category.id, {
        active,
        color: category.color,
        icon: category.icon,
        name: category.name,
        type: category.type,
      });
    }

    showToast("success", successMessage(response.body.status));
  }

  async function moveCategory(category: Category, type: CategoryType) {
    if (category.type === type) {
      return;
    }

    const values = {
      name: category.name,
      type,
      icon: category.icon,
      color: category.color,
      active: category.active,
    };
    const response = await postJson(
      `/api/categories/${category.id}`,
      values,
      "PUT",
    );

    if (!response.ok) {
      showToast(
        "error",
        response.body.error ?? "Nao foi possivel mover a categoria",
      );
      return;
    }

    updateLocalCategory(category.id, values);
    showToast("success", successMessage(response.body.status));
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
      {toast ? <SystemToast onDismiss={dismissToast} toast={toast} /> : null}

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
                    type={category.type}
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
      <div className="min-w-0 flex-1">
        <CategoryBadge
          color={category.color}
          icon={category.icon}
          name={category.name}
        />
      </div>
      <Switch active={category.active} disabled={pending} onToggle={onDeactivate} />
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
  type,
}: {
  readonly editing: EditingState;
  readonly onCancel: () => void;
  readonly onChange: (state: EditingState) => void;
  readonly onSave: (event: FormEvent<HTMLFormElement>) => void;
  readonly pending: boolean;
  readonly type: CategoryType;
}) {
  return (
    <form
      className="flex flex-wrap items-center gap-2 border-l-2 border-l-accent bg-surface-elevated/70 px-4 py-3"
      onSubmit={onSave}
    >
      <GripVertical className="size-3.5 shrink-0 text-muted/40" aria-hidden="true" />
      <CategoryVisualControls
        color={editing.color}
        icon={editing.icon}
        onIconChange={(icon) => onChange({ ...editing, icon })}
      />
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
      <CategoryColorControls
        color={editing.color}
        icon={editing.icon}
        onChange={(values) => onChange({ ...editing, ...values })}
        type={type}
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
      className="flex flex-wrap items-center gap-2 border-l-2 border-l-accent bg-surface-elevated/70 px-5 py-3"
      onSubmit={onSave}
    >
      <CategoryVisualControls
        color={adding.color}
        icon={adding.icon}
        onIconChange={(icon) => onChange({ ...adding, icon })}
      />
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
      <CategoryColorControls
        color={adding.color}
        icon={adding.icon}
        onChange={(values) => onChange({ ...adding, ...values })}
        type={adding.type}
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

function CategoryVisualControls({
  color,
  icon,
  onIconChange,
}: {
  readonly color: string;
  readonly icon: string;
  readonly onIconChange: (icon: string) => void;
}) {
  const [iconOpen, setIconOpen] = useState(false);
  const [position, setPosition] = useState({ left: 0, top: 0 });
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const Icon = categoryIconMap[icon] ?? categoryIconMap.Tag;

  function openIconPicker() {
    const button = buttonRef.current;

    if (!button) {
      return;
    }

    const rect = button.getBoundingClientRect();
    const width = 212;
    const height = 200;
    const top =
      rect.bottom + height > window.innerHeight
        ? rect.top - height - 6
        : rect.bottom + 6;
    const left =
      rect.left + width > window.innerWidth ? rect.right - width : rect.left;

    setPosition({ left, top });
    setIconOpen(true);
  }

  return (
    <>
      <button
        className="flex size-7 shrink-0 items-center justify-center rounded-md border border-border bg-surface transition hover:bg-surface-elevated focus:outline-none focus-visible:ring-1 focus-visible:ring-accent"
        onClick={openIconPicker}
        ref={buttonRef}
        style={{ color }}
        title="Escolher icone"
        type="button"
      >
        <Icon className="size-3.5" aria-hidden="true" />
        <span className="sr-only">Escolher icone</span>
      </button>

      {iconOpen
        ? createPortal(
            <>
              <button
                aria-label="Fechar seletor de icones"
                className="fixed inset-0 z-40 cursor-default"
                onClick={() => setIconOpen(false)}
                type="button"
              />
              <div
                className="fixed z-50 w-[212px] rounded-xl border border-border bg-surface p-2 shadow-2xl"
                style={{ left: position.left, top: position.top }}
              >
                <div className="grid grid-cols-6 gap-1">
                  {categoryIconOptions.map(({ Icon: OptionIcon, id }) => (
                    <button
                      className={`flex size-7 items-center justify-center rounded-md transition ${
                        icon === id
                          ? "bg-accent/20 text-accent"
                          : "text-muted hover:bg-surface-elevated hover:text-foreground"
                      }`}
                      key={id}
                      onClick={() => {
                        onIconChange(id);
                        setIconOpen(false);
                      }}
                      title={id}
                      type="button"
                    >
                      <OptionIcon className="size-3.5" aria-hidden="true" />
                    </button>
                  ))}
                </div>
              </div>
            </>,
            document.body,
          )
        : null}
    </>
  );
}

function CategoryColorControls({
  color,
  icon,
  onChange,
  type,
}: {
  readonly color: string;
  readonly icon: string;
  readonly onChange: (values: { icon: string; color: string }) => void;
  readonly type: CategoryType;
}) {
  const colors = type === "INCOME" ? incomeCategoryColors : expenseCategoryColors;

  return (
      <div className="flex shrink-0 items-center gap-1">
        {colors.map((option) => (
          <button
            className={`size-4 rounded-full transition ${
              color === option.value
                ? "scale-125 ring-2 ring-offset-1 ring-offset-background"
                : "hover:scale-110"
            }`}
            key={option.id}
            onClick={() => onChange({ color: option.value, icon })}
            style={{
              backgroundColor: option.value,
              boxShadow:
                color === option.value ? `0 0 0 2px ${option.value}` : undefined,
            }}
            title={option.label}
            type="button"
          />
        ))}
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
