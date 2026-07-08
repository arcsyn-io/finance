import Link from "next/link";
import { Check, Eye, EyeOff, Plus, RotateCcw, Save } from "lucide-react";
import { Category, categoryTypes, CategoryType } from "@/domain/category/category";
import {
  activateCategory,
  createCategory,
  deactivateCategory,
  updateCategory,
} from "@/server/actions/category-actions";
import { getCurrentApplicationContext } from "@/server/context/current-application-context";
import { createCategoryService } from "@/server/services/category-service-factory";

type CategoriesPageProps = {
  searchParams?: Promise<{
    showInactive?: string;
    status?: string;
    error?: string;
  }>;
};

const categoryTypeLabels: Record<CategoryType, string> = {
  INCOME: "Receitas",
  EXPENSE: "Despesas",
};

const categoryStatusMessages: Record<string, string> = {
  created: "Categoria criada com sucesso",
  updated: "Categoria atualizada com sucesso",
  activated: "Categoria ativada com sucesso",
  deactivated: "Categoria desativada com sucesso",
};

export const dynamic = "force-dynamic";

export default async function CategoriesPage({
  searchParams,
}: CategoriesPageProps) {
  const params = (await searchParams) ?? {};
  const showInactive = params.showInactive === "true";
  const context = await getCurrentApplicationContext();
  const categoryService = await createCategoryService();
  const categories = await categoryService.list(context, {
    includeInactive: showInactive,
  });
  const groupedCategories = {
    INCOME: categories.filter((category) => category.type === "INCOME"),
    EXPENSE: categories.filter((category) => category.type === "EXPENSE"),
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 border-b border-border pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <Link className="text-sm text-accent hover:underline" href="/">
              Finance
            </Link>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal sm:text-4xl">
              Categorias
            </h1>
          </div>
          <Link
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border px-4 text-sm font-semibold text-foreground transition hover:border-accent"
            href={showInactive ? "/categories" : "/categories?showInactive=true"}
          >
            {showInactive ? (
              <EyeOff className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Eye className="h-4 w-4" aria-hidden="true" />
            )}
            {showInactive ? "Ocultar inativas" : "Mostrar inativas"}
          </Link>
        </header>

        {params.status ? (
          <p className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            {categoryStatusMessages[params.status] ?? "Operacao concluida"}
          </p>
        ) : null}

        {params.error ? (
          <p className="rounded-md border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {params.error}
          </p>
        ) : null}

        <section className="rounded-lg border border-border bg-panel">
          <div className="border-b border-border px-5 py-4">
            <h2 className="text-base font-semibold">Nova categoria</h2>
          </div>
          <form
            action={createCategory}
            className="grid gap-3 p-5 md:grid-cols-[1fr_220px_auto]"
          >
            <label className="flex flex-col gap-2 text-sm">
              Nome
              <input
                className="h-10 rounded-md border border-border bg-background px-3 text-foreground outline-none transition focus:border-accent"
                name="name"
                placeholder="Ex.: Alimentacao"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              Tipo
              <select
                className="h-10 rounded-md border border-border bg-background px-3 text-foreground outline-none transition focus:border-accent"
                name="type"
                defaultValue="EXPENSE"
              >
                {categoryTypes.map((type) => (
                  <option key={type} value={type}>
                    {type === "INCOME" ? "Receita" : "Despesa"}
                  </option>
                ))}
              </select>
            </label>
            <button className="inline-flex h-10 items-center justify-center gap-2 self-end rounded-md bg-accent px-4 text-sm font-semibold text-background transition hover:brightness-110">
              <Plus className="h-4 w-4" aria-hidden="true" />
              Criar
            </button>
          </form>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          {categoryTypes.map((type) => (
            <CategorySection
              categories={groupedCategories[type]}
              key={type}
              title={categoryTypeLabels[type]}
            />
          ))}
        </div>
      </section>
    </main>
  );
}

function CategorySection({
  categories,
  title,
}: {
  categories: Category[];
  title: string;
}) {
  return (
    <section className="rounded-lg border border-border bg-panel">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <h2 className="text-base font-semibold">{title}</h2>
        <span className="text-sm text-muted">{categories.length}</span>
      </div>
      <div className="divide-y divide-border">
        {categories.length === 0 ? (
          <p className="p-5 text-sm text-muted">Nenhuma categoria cadastrada.</p>
        ) : (
          categories.map((category) => (
            <CategoryRow category={category} key={category.id} />
          ))
        )}
      </div>
    </section>
  );
}

function CategoryRow({ category }: { category: Category }) {
  return (
    <article className="grid gap-3 p-4">
      <form
        action={updateCategory}
        className="grid gap-3 md:grid-cols-[1fr_150px_90px_auto]"
      >
        <input name="id" type="hidden" value={category.id} />
        <label className="flex flex-col gap-2 text-sm">
          Nome
          <input
            className="h-10 rounded-md border border-border bg-background px-3 text-foreground outline-none transition focus:border-accent"
            defaultValue={category.name}
            name="name"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm">
          Tipo
          <select
            className="h-10 rounded-md border border-border bg-background px-3 text-foreground outline-none transition focus:border-accent"
            defaultValue={category.type}
            name="type"
          >
            {categoryTypes.map((type) => (
              <option key={type} value={type}>
                {type === "INCOME" ? "Receita" : "Despesa"}
              </option>
            ))}
          </select>
        </label>
        <label className="flex h-10 items-center gap-2 self-end text-sm">
          <input
            className="h-4 w-4 accent-[hsl(var(--accent))]"
            defaultChecked={category.active}
            name="active"
            type="checkbox"
          />
          Ativa
        </label>
        <button className="inline-flex h-10 items-center justify-center gap-2 self-end rounded-md border border-border px-3 text-sm font-semibold transition hover:border-accent">
          <Save className="h-4 w-4" aria-hidden="true" />
          Salvar
        </button>
      </form>
      <form
        action={category.active ? deactivateCategory : activateCategory}
        className="flex justify-end"
      >
        <input name="id" type="hidden" value={category.id} />
        <button className="inline-flex h-9 items-center justify-center gap-2 rounded-md px-3 text-sm text-muted transition hover:bg-background hover:text-foreground">
          {category.active ? (
            <Check className="h-4 w-4" aria-hidden="true" />
          ) : (
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
          )}
          {category.active ? "Desativar" : "Ativar"}
        </button>
      </form>
    </article>
  );
}
