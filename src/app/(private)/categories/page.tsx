import Link from "next/link";
import { Eye, EyeOff, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
    <div className="flex w-full flex-col gap-5 lg:gap-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <Link className="text-[10px] font-semibold uppercase tracking-widest text-accent" href="/">
            Operacao
          </Link>
          <h1 className="mt-2 text-xl font-semibold tracking-tight">
            Categorias
          </h1>
          <p className="mt-1 max-w-3xl text-xs leading-5 text-muted">
            Organize receitas e despesas sem misturar classificacoes
            operacionais com liquidez ou patrimonio.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href={showInactive ? "/categories" : "/categories?showInactive=true"}>
            {showInactive ? (
              <EyeOff aria-hidden="true" />
            ) : (
              <Eye aria-hidden="true" />
            )}
            {showInactive ? "Ocultar inativas" : "Mostrar inativas"}
          </Link>
        </Button>
      </header>

      {params.status ? (
        <div className="rounded-lg border border-positive/40 bg-positive/10 px-4 py-3 text-xs text-positive">
          {categoryStatusMessages[params.status] ?? "Operacao concluida"}
        </div>
      ) : null}

      {params.error ? (
        <div className="rounded-lg border border-negative/40 bg-negative/10 px-4 py-3 text-xs text-negative">
          {params.error}
        </div>
      ) : null}

      <Card>
        <CardHeader className="flex-row items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-md bg-accent/15 text-accent">
            <Plus className="size-4" aria-hidden="true" />
          </div>
          <div>
            <CardTitle>Nova categoria</CardTitle>
            <p className="mt-1 text-xs text-muted">
              Cadastre uma classificacao operacional para receitas ou despesas.
            </p>
          </div>
        </CardHeader>
        <CreateCategoryForm categoryTypes={categoryTypes} />
      </Card>

      <div className="grid gap-3 lg:grid-cols-2">
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
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        <Badge>{categories.length}</Badge>
      </CardHeader>
      <CardContent className="divide-y divide-border p-0">
        {categories.length === 0 ? (
          <p className="p-5 text-xs text-muted">Nenhuma categoria cadastrada.</p>
        ) : (
          categories.map((category) => (
            <CategoryRowForms
              category={category}
              categoryTypes={categoryTypes}
              key={category.id}
            />
          ))
        )}
      </CardContent>
    </Card>
  );
}
