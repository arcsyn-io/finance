import Link from "next/link";
import { notFound } from "next/navigation";
import { EntriesTable } from "@/modules/entries/components/EntriesTable";
import { WalletTypeBadge } from "@/modules/wallets/components/WalletTypeBadge";
import { createWalletListItems } from "@/modules/wallets/view-models/wallet-list-item";
import { getCurrentApplicationContext } from "@/server/context/current-application-context";
import { createCategoryService } from "@/server/services/category-service-factory";
import { createEntryService } from "@/server/services/entry-service-factory";
import { createWalletService } from "@/server/services/wallet-service-factory";

export const dynamic = "force-dynamic";

type WalletDetailPageProps = {
  readonly params: Promise<{ id: string }>;
};

export default async function WalletDetailPage({
  params,
}: WalletDetailPageProps) {
  const { id } = await params;
  const context = await getCurrentApplicationContext();
  const walletService = createWalletService();
  const entryService = createEntryService();
  const categoryService = await createCategoryService();
  const [wallets, entries, categories] = await Promise.all([
    walletService.list(context, { includeInactive: true }),
    entryService.list(context, { includeDeleted: false }),
    categoryService.list(context, { includeInactive: false }),
  ]);
  const wallet = wallets.find((item) => item.id === id);

  if (!wallet) {
    notFound();
  }

  const walletEntries = entries.filter((entry) => entry.walletId === wallet.id);
  const [walletItem] = createWalletListItems([wallet], walletEntries);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="flex w-full flex-col gap-5 lg:gap-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <Link
            className="text-[10px] font-semibold uppercase tracking-widest text-accent"
            href="/wallets"
          >
            Carteiras
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight">
              {wallet.name}
            </h1>
            <WalletTypeBadge type={wallet.type} />
          </div>
          <p className="mt-1 max-w-3xl text-xs leading-5 text-muted">
            Saldo atual {formatMoney(walletItem.balanceCents)}. Consulte e corrija
            os lançamentos que compõem esta carteira.
          </p>
        </div>
      </header>

      <EntriesTable
        categories={categories}
        initialEndDate={today}
        initialEntries={walletEntries}
        initialStartDate={today}
        mode="wallet"
        transferEntries={entries}
        walletId={wallet.id}
        wallets={wallets.filter((item) => item.active)}
      />
    </div>
  );
}

function formatMoney(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    currency: "BRL",
    style: "currency",
  }).format(cents / 100);
}
