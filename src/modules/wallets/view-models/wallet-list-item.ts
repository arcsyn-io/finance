import type { Entry } from "@/domain/entry/entry";
import type { Wallet } from "@/domain/wallet/wallet";

export type WalletListItem = {
  readonly wallet: Wallet;
  readonly entryBalanceCents: number;
  readonly balanceCents: number;
};

export function createWalletListItems(
  wallets: readonly Wallet[],
  entries: readonly Entry[],
): WalletListItem[] {
  const entryBalanceByWalletId = new Map<string, number>();

  for (const entry of entries) {
    if (entry.deletedAt) continue;

    const signedAmountCents =
      entry.direction === "IN" ? entry.amountCents : -entry.amountCents;
    const currentBalance = entryBalanceByWalletId.get(entry.walletId) ?? 0;

    entryBalanceByWalletId.set(
      entry.walletId,
      currentBalance + signedAmountCents,
    );
  }

  return wallets.map((wallet) => {
    const entryBalanceCents = entryBalanceByWalletId.get(wallet.id) ?? 0;

    return {
      wallet,
      entryBalanceCents,
      balanceCents: wallet.initialBalanceCents + entryBalanceCents,
    };
  });
}
