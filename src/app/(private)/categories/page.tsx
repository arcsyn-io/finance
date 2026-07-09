import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
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
        <div className="rounded-md border border-positive/40 bg-positive/10 px-4 py-3 text-sm text-emerald-100">
          {categoryStatusMessages[params.status] ?? "Operacao concluida"}
        </div>
      ) : null}

      {params.error ? (
        <div className="rounded-md border border-negative/40 bg-negative/10 px-4 py-3 text-sm text-red-100">
          {params.error}
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Nova categoria</CardTitle>
        </CardHeader>
        <CreateCategoryForm categoryTypes={categoryTypes} />
      </Card>

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
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        <Badge>{categories.length}</Badge>
      </CardHeader>
      <CardContent className="divide-y divide-border p-0">
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
      </CardContent>
    </Card>
  );
}
