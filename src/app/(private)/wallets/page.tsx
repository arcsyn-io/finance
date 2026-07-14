import Link from "next/link";
import { WalletsList } from "@/modules/wallets/components/WalletsList";
import { createWalletListItems } from "@/modules/wallets/view-models/wallet-list-item";
import { getCurrentApplicationContext } from "@/server/context/current-application-context";
import { createCategoryService } from "@/server/services/category-service-factory";
import { createEntryService } from "@/server/services/entry-service-factory";
import { createWalletService } from "@/server/services/wallet-service-factory";

export const dynamic = "force-dynamic";

export default async function WalletsPage() {
  const context = await getCurrentApplicationContext();
  const walletService = createWalletService();
  const entryService = createEntryService();
  const categoryService = await createCategoryService();
  const [wallets, entries, categories] = await Promise.all([
    walletService.list(context, { includeInactive: true }),
    entryService.list(context, { includeDeleted: false }),
    categoryService.list(context, { includeInactive: false }),
  ]);

  return (
    <div className="flex w-full flex-col gap-5 lg:gap-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <Link
            className="text-[10px] font-semibold uppercase tracking-widest text-accent"
            href="/"
          >
            Registros
          </Link>
          <h1 className="mt-2 text-xl font-semibold tracking-tight">
            Carteiras
          </h1>
          <p className="mt-1 max-w-3xl text-xs leading-5 text-muted">
            Gerencie as carteiras financeiras utilizadas nas movimentacoes do
            sistema.
          </p>
        </div>
      </header>

      <WalletsList
        categories={categories}
        initialWallets={createWalletListItems(wallets, entries)}
      />
    </div>
  );
}
