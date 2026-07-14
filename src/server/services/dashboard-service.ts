import type { GetDashboardCommand } from "@/server/commands/dashboard-commands";
import type { ApplicationContext } from "@/server/context/application-context";
import type {
  DashboardWalletDto,
  PersonalDashboardDto,
} from "@/server/dto/dashboard-dto";
import type { DashboardRepository } from "@/server/repositories/dashboard-repository";

export class DashboardService {
  constructor(private readonly repository: DashboardRepository) {}

  async get(
    context: ApplicationContext,
    command: GetDashboardCommand,
  ): Promise<PersonalDashboardDto> {
    const [wallets, recentEntries] = await Promise.all([
      this.repository.listActiveWalletBalances(context),
      this.repository.listRecentEntries(context, {
        limit: command.recentEntriesLimit,
      }),
    ]);

    const realLiquidityCents = sumWalletBalances(wallets, ["CASH"]);
    const financialInvestmentsCents = sumWalletBalances(wallets, [
      "NEGOTIABLE_SECURITY",
      "LONG_TERM",
    ]);
    const assetCents = sumWalletBalances(wallets, ["ASSET"]);
    const creditCardBalanceCents = sumWalletBalances(wallets, ["CREDIT_CARD"]);

    return {
      realLiquidityCents,
      netWorthCents: wallets.reduce(
        (total, wallet) => total + wallet.balanceCents,
        0,
      ),
      financialInvestmentsCents,
      assetCents,
      creditCardDebtCents: Math.max(0, -creditCardBalanceCents),
      wallets,
      negativeWallets: wallets.filter(
        (wallet) => wallet.type !== "CREDIT_CARD" && wallet.balanceCents < 0,
      ),
      recentEntries,
    };
  }
}

function sumWalletBalances(
  wallets: readonly DashboardWalletDto[],
  types: readonly DashboardWalletDto["type"][],
): number {
  return wallets.reduce(
    (total, wallet) =>
      types.includes(wallet.type) ? total + wallet.balanceCents : total,
    0,
  );
}
