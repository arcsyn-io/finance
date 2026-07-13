"use client";

import { useMemo, useState } from "react";
import type { Category } from "@/domain/category/category";
import type { Wallet } from "@/domain/wallet/wallet";
import type {
  AnnualCashFlowViewModel,
  CashFlowMonthViewModel,
} from "@/modules/cash-flow/view-models/cash-flow-view-model";
import { CashFlowConfigDialog } from "@/modules/cash-flow/components/CashFlowConfigDialog";
import {
  CashFlowEntriesDialog,
  type CashFlowDetailSelection,
} from "@/modules/cash-flow/components/CashFlowEntriesDialog";
import { CashFlowMatrix } from "@/modules/cash-flow/components/CashFlowMatrix";
import { NonOperationalCashFlow } from "@/modules/cash-flow/components/NonOperationalCashFlow";

type CashFlowWorkspaceProps = {
  readonly categories: readonly Category[];
  readonly report: AnnualCashFlowViewModel;
  readonly wallets: readonly Wallet[];
};

export function CashFlowWorkspace({
  categories,
  report,
  wallets,
}: CashFlowWorkspaceProps) {
  const [detail, setDetail] = useState<CashFlowDetailSelection | null>(null);
  const [configMonth, setConfigMonth] = useState<CashFlowMonthViewModel | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const cashWalletIds = useMemo(
    () => wallets.filter((wallet) => wallet.type === "CASH").map((wallet) => wallet.id),
    [wallets],
  );

  return (
    <section aria-label="Detalhamento anual" className="flex flex-col gap-5 lg:gap-6">
      {feedback ? (
        <div
          className="flex items-center justify-between gap-4 rounded-lg border border-positive/30 bg-positive/10 px-4 py-3 text-xs text-positive"
          role="status"
        >
          <span>{feedback}</span>
          <button
            aria-label="Dispensar mensagem"
            className="rounded-sm font-semibold text-positive/80 hover:text-positive focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-positive"
            onClick={() => setFeedback(null)}
            type="button"
          >
            Fechar
          </button>
        </div>
      ) : null}

      <CashFlowMatrix
        onOpenConfig={(month) => {
          setFeedback(null);
          setConfigMonth(month);
        }}
        onOpenDetail={setDetail}
        report={report}
      />
      <NonOperationalCashFlow onOpenDetail={setDetail} report={report} />

      {configMonth ? (
        <CashFlowConfigDialog
          key={configMonth.referenceMonth}
          month={configMonth}
          onClose={() => setConfigMonth(null)}
          onSaved={(message) => {
            setFeedback(message);
            setConfigMonth(null);
          }}
        />
      ) : null}
      {detail ? (
        <CashFlowEntriesDialog
          cashWalletIds={cashWalletIds}
          categories={categories}
          onClose={() => setDetail(null)}
          selection={detail}
          wallets={wallets}
        />
      ) : null}
    </section>
  );
}
