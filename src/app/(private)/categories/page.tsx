import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { Category, categoryTypes, CategoryType } from "@/domain/category/category";
import {
  CategoryRowForms,
  CreateCategoryForm,
} from "@/modules/categories/components/CategoryForms";
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
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <header className="flex flex-col gap-4 border-b border-border pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <Link className="text-xs font-bold uppercase text-accent" href="/">
            Operacao
          </Link>
          <h1 className="mt-2 text-3xl font-semibold leading-tight sm:text-4xl">
            Categorias
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
            Organize receitas e despesas sem misturar classificacoes
            operacionais com liquidez ou patrimonio.
          </p>
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
        <p className="rounded-md border border-positive/40 bg-positive/10 px-4 py-3 text-sm text-emerald-100">
          {categoryStatusMessages[params.status] ?? "Operacao concluida"}
        </p>
      ) : null}

      {params.error ? (
        <p className="rounded-md border border-negative/40 bg-negative/10 px-4 py-3 text-sm text-red-100">
          {params.error}
        </p>
      ) : null}

      <section className="rounded-md border border-border bg-panel">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-base font-semibold">Nova categoria</h2>
        </div>
        <CreateCategoryForm categoryTypes={categoryTypes} />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {categoryTypes.map((type) => (
          <CategorySection
            categories={groupedCategories[type]}
            categoryTypes={categoryTypes}
            key={type}
            title={categoryTypeLabels[type]}
          />
        ))}
      </div>
    </div>
  );
}

function CategorySection({
  categories,
  categoryTypes,
  title,
}: {
  categories: Category[];
  categoryTypes: readonly CategoryType[];
  title: string;
}) {
  return (
    <section className="rounded-md border border-border bg-panel">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <h2 className="text-base font-semibold">{title}</h2>
        <span className="rounded-full border border-border px-2 py-1 text-xs font-bold text-muted">
          {categories.length}
        </span>
      </div>
      <div className="divide-y divide-border">
        {categories.length === 0 ? (
          <p className="p-5 text-sm text-muted">Nenhuma categoria cadastrada.</p>
        ) : (
          categories.map((category) => (
            <CategoryRowForms
              category={category}
              categoryTypes={categoryTypes}
              key={category.id}
            />
          ))
        )}
      </div>
    </section>
  );
}
