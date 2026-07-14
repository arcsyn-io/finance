import type { EntryDirection } from "@/domain/entry/entry";
import type { WalletType } from "@/domain/wallet/wallet";

export type DashboardWalletDto = {
  readonly id: string;
  readonly name: string;
  readonly type: WalletType;
  readonly balanceCents: number;
};

export type DashboardRecentEntryDto = {
  readonly id: string;
  readonly description: string | null;
  readonly direction: EntryDirection;
  readonly amountCents: number;
  readonly occurredOn: string;
  readonly walletName: string;
  readonly categoryName: string | null;
};

export type PersonalDashboardDto = {
  readonly realLiquidityCents: number;
  readonly netWorthCents: number;
  readonly financialInvestmentsCents: number;
  readonly assetCents: number;
  readonly creditCardDebtCents: number;
  readonly wallets: readonly DashboardWalletDto[];
  readonly negativeWallets: readonly DashboardWalletDto[];
  readonly recentEntries: readonly DashboardRecentEntryDto[];
};
