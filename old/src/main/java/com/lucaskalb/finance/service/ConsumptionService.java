package com.lucaskalb.finance.service;

import com.lucaskalb.finance.dto.CategoryConsumption;
import com.lucaskalb.finance.dto.MonthlyConsumption;
import com.lucaskalb.finance.repository.EntryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ConsumptionService {

    private final EntryRepository entryRepository;

    @Transactional(readOnly = true)
    public List<CategoryConsumption> getConsumptionByCategory(LocalDateTime startDate, LocalDateTime endDate) {
        return entryRepository.getConsumptionByCategory(startDate, endDate);
    }

    @Transactional(readOnly = true)
    public long getTotalConsumption(LocalDateTime startDate, LocalDateTime endDate) {
        return entryRepository.getTotalConsumption(startDate, endDate);
    }

    @Transactional(readOnly = true)
    public Map<YearMonth, List<MonthlyConsumption>> getMonthlyConsumptionGrouped(LocalDateTime startDate, LocalDateTime endDate) {
        var monthlyData = entryRepository.getMonthlyConsumptionByCategory(startDate, endDate);
        return monthlyData.stream()
                .collect(Collectors.groupingBy(
                        MonthlyConsumption::month,
                        LinkedHashMap::new,
                        Collectors.toList()
                ));
    }

    @Transactional(readOnly = true)
    public Map<YearMonth, Long> getMonthlyTotals(LocalDateTime startDate, LocalDateTime endDate) {
        var monthlyData = entryRepository.getMonthlyConsumptionByCategory(startDate, endDate);
        return monthlyData.stream()
                .collect(Collectors.groupingBy(
                        MonthlyConsumption::month,
                        LinkedHashMap::new,
                        Collectors.summingLong(MonthlyConsumption::amount)
                ));
    }
}
