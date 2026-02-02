package com.lucaskalb.finance.controller;

import com.lucaskalb.finance.service.ConsumptionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;

@Controller
@RequestMapping("/consumption")
@RequiredArgsConstructor
public class ConsumptionController {

    private final ConsumptionService consumptionService;

    public enum ConsumptionPeriod {
        LAST_6_MONTHS("Último Semestre"),
        LAST_12_MONTHS("Último Ano"),
        CURRENT_YEAR("Ano Atual"),
        CUSTOM("Personalizado");

        private final String label;

        ConsumptionPeriod(String label) {
            this.label = label;
        }

        public String getLabel() {
            return label;
        }
    }

    @GetMapping
    public String index(
            @RequestParam(required = false, defaultValue = "LAST_6_MONTHS") ConsumptionPeriod period,
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate,
            Model model
    ) {
        var dateRange = calculateDateRange(period, startDate, endDate);

        var consumptionByCategory = consumptionService.getConsumptionByCategory(dateRange.start(), dateRange.end());
        var totalConsumption = consumptionService.getTotalConsumption(dateRange.start(), dateRange.end());
        var monthlyData = consumptionService.getMonthlyConsumptionGrouped(dateRange.start(), dateRange.end());
        var monthlyTotals = consumptionService.getMonthlyTotals(dateRange.start(), dateRange.end());

        // Build list of months for columns
        List<YearMonth> months = new ArrayList<>(monthlyTotals.keySet());

        // Build matrix: categoryId-month -> amount
        var monthlyMatrix = new HashMap<String, Long>();
        for (var entry : monthlyData.entrySet()) {
            for (var consumption : entry.getValue()) {
                monthlyMatrix.put(consumption.categoryId() + "-" + entry.getKey(), consumption.amount());
            }
        }

        model.addAttribute("title", "Consumo por Categoria - Finance");
        model.addAttribute("periods", ConsumptionPeriod.values());
        model.addAttribute("selectedPeriod", period);
        model.addAttribute("startDate", dateRange.start().toLocalDate());
        model.addAttribute("endDate", dateRange.end().toLocalDate().minusDays(1));
        model.addAttribute("periodLabel", formatPeriodLabel(dateRange.start().toLocalDate(), dateRange.end().toLocalDate().minusDays(1)));

        model.addAttribute("consumptionByCategory", consumptionByCategory);
        model.addAttribute("totalConsumption", totalConsumption);
        model.addAttribute("months", months);
        model.addAttribute("monthlyMatrix", monthlyMatrix);
        model.addAttribute("monthlyTotals", monthlyTotals);

        return "pages/consumption";
    }

    private record DateRange(java.time.LocalDateTime start, java.time.LocalDateTime end) {}

    private DateRange calculateDateRange(ConsumptionPeriod period, LocalDate customStart, LocalDate customEnd) {
        var today = LocalDate.now();

        return switch (period) {
            case LAST_6_MONTHS -> {
                var start = today.minusMonths(5).withDayOfMonth(1);
                var end = today.plusMonths(1).withDayOfMonth(1);
                yield new DateRange(start.atStartOfDay(), end.atStartOfDay());
            }
            case LAST_12_MONTHS -> {
                var start = today.minusMonths(11).withDayOfMonth(1);
                var end = today.plusMonths(1).withDayOfMonth(1);
                yield new DateRange(start.atStartOfDay(), end.atStartOfDay());
            }
            case CURRENT_YEAR -> {
                var start = today.withMonth(1).withDayOfMonth(1);
                var end = today.plusMonths(1).withDayOfMonth(1);
                yield new DateRange(start.atStartOfDay(), end.atStartOfDay());
            }
            case CUSTOM -> {
                var start = customStart != null ? customStart : today.minusMonths(5).withDayOfMonth(1);
                var end = customEnd != null ? customEnd.plusDays(1) : today.plusDays(1);
                yield new DateRange(start.atStartOfDay(), end.atStartOfDay());
            }
        };
    }

    private String formatPeriodLabel(LocalDate start, LocalDate end) {
        var locale = new Locale("pt", "BR");
        var startMonth = start.getMonth().getDisplayName(TextStyle.SHORT, locale);
        var endMonth = end.getMonth().getDisplayName(TextStyle.SHORT, locale);

        if (start.getYear() == end.getYear()) {
            return capitalize(startMonth) + " - " + capitalize(endMonth) + " " + end.getYear();
        } else {
            return capitalize(startMonth) + "/" + start.getYear() + " - " + capitalize(endMonth) + "/" + end.getYear();
        }
    }

    private String capitalize(String s) {
        return s.substring(0, 1).toUpperCase() + s.substring(1);
    }
}
