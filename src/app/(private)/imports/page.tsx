import Link from "next/link";
import { ImportsWorkspace } from "@/modules/imports/components/ImportsWorkspace";
import { getCurrentApplicationContext } from "@/server/context/current-application-context";
import { createCategoryService } from "@/server/services/category-service-factory";
import { createImportService } from "@/server/services/import-service-factory";
import { createWalletService } from "@/server/services/wallet-service-factory";

export const dynamic = "force-dynamic";

export default async function ImportsPage() {
  const context = await getCurrentApplicationContext();
  const importService = createImportService();
  const walletService = createWalletService();
  const categoryService = await createCategoryService();

  const [imports, wallets, categories] = await Promise.all([
    importService.list(context, { includeConfirmed: true }),
    walletService.list(context, { includeInactive: false }),
    categoryService.list(context, { includeInactive: false }),
  ]);

  return (
    <div className="flex w-full flex-col gap-5 lg:gap-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <Link
            className="text-[10px] font-semibold uppercase tracking-widest text-accent"
            href="/transactions"
          >
            Registros
          </Link>
          <h1 className="mt-2 text-xl font-semibold tracking-tight">
            Importacoes
          </h1>
          <p className="mt-1 max-w-3xl text-xs leading-5 text-muted">
            Importe CSV do Nubank para uma area de revisao antes de criar
            lancamentos definitivos.
          </p>
        </div>
      </header>

      <ImportsWorkspace
        categories={categories}
        initialImports={imports}
        wallets={wallets}
      />
    </div>
  );
}
