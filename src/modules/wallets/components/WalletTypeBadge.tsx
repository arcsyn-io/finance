import type { WalletType } from "@/domain/wallet/wallet";
import { walletTypeLabels } from "@/domain/wallet/wallet";

const walletTypeColors: Record<WalletType, { bg: string; color: string }> = {
  CASH: {
    bg: "oklch(0.68 0.07 235 / 0.14)",
    color: "oklch(0.68 0.07 235)",
  },
  CREDIT_CARD: {
    bg: "oklch(0.79 0.13 78 / 0.14)",
    color: "oklch(0.75 0.13 78)",
  },
  NEGOTIABLE_SECURITY: {
    bg: "oklch(0.60 0.02 250 / 0.25)",
    color: "oklch(0.72 0.018 250)",
  },
  LONG_TERM: {
    bg: "oklch(0.72 0.13 158 / 0.14)",
    color: "oklch(0.72 0.13 158)",
  },
  ASSET: {
    bg: "oklch(0.60 0.15 290 / 0.14)",
    color: "oklch(0.72 0.12 290)",
  },
};

export function WalletTypeBadge({ type }: { readonly type: WalletType }) {
  const { bg, color } = walletTypeColors[type];

  return (
    <span
      className="inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-medium"
      style={{ background: bg, color }}
    >
      {walletTypeLabels[type]}
    </span>
  );
}
