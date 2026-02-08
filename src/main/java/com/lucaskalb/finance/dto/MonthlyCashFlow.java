package com.lucaskalb.finance.dto;

import java.time.YearMonth;

public record MonthlyCashFlow(
    YearMonth referenceMonth,
    long totalReceipts,          // Recebimentos Totais
    long totalExpenses,          // Despesas Totais
    long netCashFlow,            // Fluxo de Caixa Líquido (recebimentos - despesas)
    long openingBalance,         // Saldo de Caixa Inicial (configurável)
    long closingBalance,         // Saldo de Caixa Final (fluxo líquido + saldo inicial)
    long minimumCash,            // Caixa Mínimo (configurável)
    long surplusOrDeficit,       // Excedente/Resgate (saldo final - caixa mínimo)
    long nonOperationalCashIn,   // Entradas não-operacionais (resgates, transferências recebidas)
    long nonOperationalCashOut   // Saídas não-operacionais (aplicações, transferências enviadas)
) {
    public boolean hasSurplus() {
        return surplusOrDeficit >= 0;
    }

    public boolean needsWithdrawal() {
        return surplusOrDeficit < 0;
    }
}
