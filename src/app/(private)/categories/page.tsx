import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CategoryGroups } from "@/modules/categories/components/CategoryForms";
import { getCurrentApplicationContext } from "@/server/context/current-application-context";
import { createCategoryService } from "@/server/services/category-service-factory";

type CategoriesPageProps = {
  searchParams?: Promise<{
    showInactive?: string;
    status?: string;
    error?: string;
  }>;
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
            Gerencie as categorias de receitas e despesas utilizadas nas
            transacoes.
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

      <CategoryGroups initialCategories={categories} />
    </div>
  );
}
