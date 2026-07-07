package com.lucaskalb.finance.service;

import com.lucaskalb.finance.dto.AnnualCashFlow;
import com.lucaskalb.finance.dto.MonthlyCashFlow;
import com.lucaskalb.finance.dto.NonOpCategoryRow;
import com.lucaskalb.finance.dto.UpdateCashFlowConfigCommand;
import com.lucaskalb.finance.model.Entry;
import com.lucaskalb.finance.model.EntryDirection;
import com.lucaskalb.finance.repository.CashFlowConfigRepository;
import com.lucaskalb.finance.repository.EntryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.YearMonth;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
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

        var nonOperationalCashIn = entryRepository.calculateMonthlyNonOperationalCashIn(startDate, endDate);
        var nonOperationalCashOut = entryRepository.calculateMonthlyNonOperationalCashOut(startDate, endDate);

        return new MonthlyCashFlow(
                referenceMonth,
                totalReceipts,
                totalExpenses,
                netCashFlow,
                openingBalance,
                closingBalance,
                minimumCash,
                surplusOrDeficit,
                nonOperationalCashIn,
                nonOperationalCashOut
        );
    }

    @Transactional(readOnly = true)
    public List<Entry> listMonthlyEntries(YearMonth referenceMonth, EntryDirection direction) {
        var startDate = referenceMonth.atDay(1).atStartOfDay();
        var endDate = referenceMonth.plusMonths(1).atDay(1).atStartOfDay();
        return entryRepository.listCashFlowEntries(startDate, endDate, direction);
    }

    @Transactional(readOnly = true)
    public List<Entry> listOperationalMonthlyEntries(YearMonth referenceMonth, EntryDirection direction, long categoryId) {
        var startDate = referenceMonth.atDay(1).atStartOfDay();
        var endDate = referenceMonth.plusMonths(1).atDay(1).atStartOfDay();
        return entryRepository.listOperationalCashEntries(startDate, endDate, direction, categoryId);
    }

    @Transactional(readOnly = true)
    public List<Entry> listNonOperationalMonthlyEntries(YearMonth referenceMonth, EntryDirection direction, long categoryId) {
        var startDate = referenceMonth.atDay(1).atStartOfDay();
        var endDate = referenceMonth.plusMonths(1).atDay(1).atStartOfDay();
        return entryRepository.listNonOperationalCashEntries(startDate, endDate, direction, categoryId);
    }

    @Transactional(readOnly = true)
    public List<NonOpCategoryRow> getOperationalCategoryRows(int year, EntryDirection direction) {
        var startDate = YearMonth.of(year, 1).atDay(1).atStartOfDay();
        var endDate = YearMonth.of(year + 1, 1).atDay(1).atStartOfDay();

        var rawData = entryRepository.listOperationalCashByCategory(startDate, endDate);

        var categoryAmounts = new HashMap<Long, long[]>();
        var categoryNames = new HashMap<Long, String>();

        for (var row : rawData) {
            var month = (String) row[0];
            var categoryId = (long) row[1];
            var categoryName = (String) row[2];
            var dir = (String) row[3];
            var amount = (long) row[4];

            if (!dir.equals(direction.name())) continue;

            var monthIndex = YearMonth.parse(month).getMonthValue() - 1;
            categoryAmounts.computeIfAbsent(categoryId, id -> new long[12]);
            categoryAmounts.get(categoryId)[monthIndex] = amount;
            categoryNames.put(categoryId, categoryName);
        }

        return categoryAmounts.entrySet().stream()
                .map(e -> {
                    var amounts = new ArrayList<Long>(12);
                    for (var v : e.getValue()) amounts.add(v);
                    return new NonOpCategoryRow(e.getKey(), categoryNames.get(e.getKey()), amounts);
                })
                .sorted(Comparator.comparingLong(r -> -r.total()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<NonOpCategoryRow> getNonOperationalCategoryRows(int year, EntryDirection direction) {
        var startDate = YearMonth.of(year, 1).atDay(1).atStartOfDay();
        var endDate = YearMonth.of(year + 1, 1).atDay(1).atStartOfDay();

        var rawData = entryRepository.listNonOperationalCashByCategory(startDate, endDate);

        var categoryAmounts = new HashMap<Long, long[]>();
        var categoryNames = new HashMap<Long, String>();

        for (var row : rawData) {
            var month = (String) row[0];
            var categoryId = (long) row[1];
            var categoryName = (String) row[2];
            var dir = (String) row[3];
            var amount = (long) row[4];

            if (!dir.equals(direction.name())) continue;

            var monthIndex = YearMonth.parse(month).getMonthValue() - 1;
            categoryAmounts.computeIfAbsent(categoryId, id -> new long[12]);
            categoryAmounts.get(categoryId)[monthIndex] = amount;
            categoryNames.put(categoryId, categoryName);
        }

        return categoryAmounts.entrySet().stream()
                .map(e -> {
                    var amounts = new ArrayList<Long>(12);
                    for (var v : e.getValue()) amounts.add(v);
                    return new NonOpCategoryRow(e.getKey(), categoryNames.get(e.getKey()), amounts);
                })
                .sorted(Comparator.comparingLong(r -> -r.total()))
                .toList();
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
