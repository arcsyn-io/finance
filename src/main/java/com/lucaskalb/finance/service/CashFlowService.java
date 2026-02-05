package com.lucaskalb.finance.service;

import com.lucaskalb.finance.dto.AnnualCashFlow;
import com.lucaskalb.finance.dto.MonthlyCashFlow;
import com.lucaskalb.finance.dto.UpdateCashFlowConfigCommand;
import com.lucaskalb.finance.repository.CashFlowConfigRepository;
import com.lucaskalb.finance.repository.EntryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Month;
import java.time.Year;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CashFlowService {

    private final CashFlowConfigRepository cashFlowConfigRepository;
    private final EntryRepository entryRepository;

    @Transactional(readOnly = true)
    public AnnualCashFlow getAnnualCashFlow(int year) {
        List<MonthlyCashFlow> months = new ArrayList<>();
        for (int m = 1; m <= 12; m++) {
            var month = YearMonth.of(year, m);
            months.add(getMonthlyCashFlow(month));
        }
        return new AnnualCashFlow(year, months);
    }

    @Transactional(readOnly = true)
    public MonthlyCashFlow getMonthlyCashFlow(YearMonth referenceMonth) {
        var startDate = referenceMonth.atDay(1).atStartOfDay();
        var endDate = referenceMonth.plusMonths(1).atDay(1).atStartOfDay();

        var totalReceipts = entryRepository.calculateMonthlyCashFlowReceipts(startDate, endDate);
        var totalExpenses = entryRepository.calculateMonthlyCashFlowExpenses(startDate, endDate);
        var netCashFlow = totalReceipts - totalExpenses;

        var config = cashFlowConfigRepository.findByMonth(referenceMonth);
        var openingBalance = config.map(c -> c.getOpeningBalance()).orElse(0L);
        var minimumCash = config.map(c -> c.getMinimumCash()).orElse(0L);

        var closingBalance = netCashFlow + openingBalance;
        var surplusOrDeficit = closingBalance - minimumCash;

        return new MonthlyCashFlow(
                referenceMonth,
                totalReceipts,
                totalExpenses,
                netCashFlow,
                openingBalance,
                closingBalance,
                minimumCash,
                surplusOrDeficit
        );
    }

    @Transactional
    public void updateCashFlowConfig(UpdateCashFlowConfigCommand command) {
        cashFlowConfigRepository.upsert(
                command.referenceMonth(),
                command.openingBalance(),
                command.minimumCash()
        );
    }

    @Transactional
    public void updateCashFlowConfigForFollowingMonths(UpdateCashFlowConfigCommand command) {
        var startMonth = command.referenceMonth();
        var endMonth = YearMonth.of(startMonth.getYear(), 12);

        var current = startMonth;
        while (!current.isAfter(endMonth)) {
            cashFlowConfigRepository.upsert(
                    current,
                    command.openingBalance(),
                    command.minimumCash()
            );
            current = current.plusMonths(1);
        }
    }
}
