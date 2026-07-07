package com.lucaskalb.finance.controller;

import com.lucaskalb.finance.model.EntryDirection;
import com.lucaskalb.finance.model.EntryNature;
import com.lucaskalb.finance.service.CategoryService;
import com.lucaskalb.finance.service.ConsumptionService;
import com.lucaskalb.finance.service.EntryService;
import com.lucaskalb.finance.service.WalletService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.YearMonth;
import java.time.format.TextStyle;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;

@Controller
@RequestMapping("/consumption")
@RequiredArgsConstructor
public class ConsumptionController {

    private final ConsumptionService consumptionService;
    private final EntryService entryService;
    private final CategoryService categoryService;
    private final WalletService walletService;

    public enum ConsumptionPeriod {
        CURRENT_MONTH("Mês atual"),
        CURRENT_QUARTER("Trimestre atual"),
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
            @RequestParam(required = false, defaultValue = "CURRENT_MONTH") ConsumptionPeriod period,
            @RequestParam(required = false, defaultValue = "0") int offset,
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate,
            Model model
    ) {
        var dateRange = calculateDateRange(period, offset, startDate, endDate);

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
        model.addAttribute("offset", offset);
        model.addAttribute("startDate", dateRange.start().toLocalDate());
        model.addAttribute("endDate", dateRange.end().toLocalDate().minusDays(1));
        model.addAttribute("periodLabel", formatPeriodLabel(period, offset, dateRange.start().toLocalDate(), dateRange.end().toLocalDate().minusDays(1)));

        model.addAttribute("consumptionByCategory", consumptionByCategory);
        model.addAttribute("totalConsumption", totalConsumption);
        model.addAttribute("months", months);
        model.addAttribute("monthlyMatrix", monthlyMatrix);
        model.addAttribute("monthlyTotals", monthlyTotals);

        return "pages/consumption";
    }

    @GetMapping("/category/{categoryId}")
    public String categoryDetail(
            @PathVariable long categoryId,
            @RequestParam LocalDate startDate,
            @RequestParam LocalDate endDate,
            Model model
    ) {
        var entries = entryService.list(
                startDate.atStartOfDay(),
                endDate.atTime(LocalTime.MAX),
                null, categoryId, EntryNature.PATRIMONIAL, false
        ).stream()
                .filter(e -> e.getDirection() == EntryDirection.OUT)
                .toList();

        var totalAmount = entries.stream().mapToLong(e -> e.getAmount()).sum();
        var categoryName = entries.isEmpty()
                ? categoryService.findById(categoryId).getName()
                : entries.getFirst().getCategoryName();

        model.addAttribute("entries", entries);
        model.addAttribute("categoryName", categoryName);
        model.addAttribute("categoryId", categoryId);
        model.addAttribute("totalAmount", totalAmount);
        model.addAttribute("categories", categoryService.listActive());
        model.addAttribute("wallets", walletService.listActive());
        model.addAttribute("natures", EntryNature.values());
        model.addAttribute("startDate", startDate);
        model.addAttribute("endDate", endDate);

        return "fragments/consumption-category-modal :: modal";
    }

    @GetMapping("/entries/{entryId}/edit-inline")
    public String editEntryInline(
            @PathVariable long entryId,
            @RequestParam long categoryId,
            @RequestParam LocalDate startDate,
            @RequestParam LocalDate endDate,
            Model model
    ) {
        var entry = entryService.findById(entryId);
        model.addAttribute("entry", entry);
        model.addAttribute("categories", categoryService.listActive());
        model.addAttribute("wallets", walletService.listActive());
        model.addAttribute("natures", EntryNature.values());
        model.addAttribute("categoryId", categoryId);
        model.addAttribute("startDate", startDate);
        model.addAttribute("endDate", endDate);

        return "fragments/consumption-category-modal :: editRow";
    }

    @GetMapping("/entries/{entryId}/row")
    public String entryRow(
            @PathVariable long entryId,
            @RequestParam long categoryId,
            @RequestParam LocalDate startDate,
            @RequestParam LocalDate endDate,
            Model model
    ) {
        var entry = entryService.findById(entryId);
        model.addAttribute("entry", entry);
        model.addAttribute("categoryId", categoryId);
        model.addAttribute("startDate", startDate);
        model.addAttribute("endDate", endDate);

        return "fragments/consumption-category-modal :: entryRow";
    }

    @PostMapping("/entries/{entryId}")
    public String updateEntryFromConsumption(
            @PathVariable long entryId,
            @RequestParam long walletId,
            @RequestParam long categoryId,
            @RequestParam EntryNature nature,
            @RequestParam(required = false) String description,
            @RequestParam long originalCategoryId,
            @RequestParam LocalDate startDate,
            @RequestParam LocalDate endDate,
            Model model
    ) {
        try {
            entryService.updateFields(entryId, walletId, categoryId, nature, null, description);
        } catch (Exception e) {
            model.addAttribute("errorMessage", e.getMessage());
        }

        var entries = entryService.list(
                startDate.atStartOfDay(),
                endDate.atTime(LocalTime.MAX),
                null, originalCategoryId, EntryNature.PATRIMONIAL, false
        ).stream()
                .filter(e -> e.getDirection() == EntryDirection.OUT)
                .toList();

        var totalAmount = entries.stream().mapToLong(e -> e.getAmount()).sum();

        model.addAttribute("entries", entries);
        model.addAttribute("categoryId", originalCategoryId);
        model.addAttribute("totalAmount", totalAmount);
        model.addAttribute("categories", categoryService.listActive());
        model.addAttribute("wallets", walletService.listActive());
        model.addAttribute("natures", EntryNature.values());
        model.addAttribute("startDate", startDate);
        model.addAttribute("endDate", endDate);

        return "fragments/consumption-category-modal :: entriesContent";
    }

    private record DateRange(java.time.LocalDateTime start, java.time.LocalDateTime end) {}

    private DateRange calculateDateRange(ConsumptionPeriod period, int offset, LocalDate customStart, LocalDate customEnd) {
        var today = LocalDate.now();

        return switch (period) {
            case CURRENT_MONTH -> {
                var targetMonth = today.plusMonths(offset);
                var start = targetMonth.with(TemporalAdjusters.firstDayOfMonth());
                var end = targetMonth.with(TemporalAdjusters.lastDayOfMonth()).plusDays(1);
                yield new DateRange(start.atStartOfDay(), end.atStartOfDay());
            }
            case CURRENT_QUARTER -> {
                var baseQuarterStart = today.withMonth(((today.getMonthValue() - 1) / 3) * 3 + 1).withDayOfMonth(1);
                var targetQuarterStart = baseQuarterStart.plusMonths(offset * 3L);
                var targetQuarterEnd = targetQuarterStart.plusMonths(3);
                yield new DateRange(targetQuarterStart.atStartOfDay(), targetQuarterEnd.atStartOfDay());
            }
            case LAST_6_MONTHS -> {
                var baseStart = today.minusMonths(5).withDayOfMonth(1);
                var targetStart = baseStart.plusMonths(offset * 6L);
                var targetEnd = targetStart.plusMonths(6);
                yield new DateRange(targetStart.atStartOfDay(), targetEnd.atStartOfDay());
            }
            case LAST_12_MONTHS -> {
                var baseStart = today.minusMonths(11).withDayOfMonth(1);
                var targetStart = baseStart.plusMonths(offset * 12L);
                var targetEnd = targetStart.plusMonths(12);
                yield new DateRange(targetStart.atStartOfDay(), targetEnd.atStartOfDay());
            }
            case CURRENT_YEAR -> {
                var baseYear = today.getYear();
                var targetYear = baseYear + offset;
                var start = LocalDate.of(targetYear, 1, 1);
                var end = LocalDate.of(targetYear + 1, 1, 1);
                yield new DateRange(start.atStartOfDay(), end.atStartOfDay());
            }
            case CUSTOM -> {
                var start = customStart != null ? customStart : today.minusMonths(5).withDayOfMonth(1);
                var end = customEnd != null ? customEnd.plusDays(1) : today.plusDays(1);
                yield new DateRange(start.atStartOfDay(), end.atStartOfDay());
            }
        };
    }

    private String formatPeriodLabel(ConsumptionPeriod period, int offset, LocalDate start, LocalDate end) {
        var locale = new Locale("pt", "BR");

        return switch (period) {
            case CURRENT_MONTH -> {
                var month = start.getMonth().getDisplayName(TextStyle.FULL, locale);
                yield capitalize(month) + " " + start.getYear();
            }
            case CURRENT_QUARTER -> {
                var quarter = ((start.getMonthValue() - 1) / 3) + 1;
                yield quarter + "º Trimestre " + start.getYear();
            }
            case CURRENT_YEAR -> String.valueOf(start.getYear());
            default -> {
                var startMonth = start.getMonth().getDisplayName(TextStyle.SHORT, locale);
                var endMonth = end.getMonth().getDisplayName(TextStyle.SHORT, locale);
                if (start.getYear() == end.getYear()) {
                    yield capitalize(startMonth) + " - " + capitalize(endMonth) + " " + end.getYear();
                } else {
                    yield capitalize(startMonth) + "/" + start.getYear() + " - " + capitalize(endMonth) + "/" + end.getYear();
                }
            }
        };
    }

    private String capitalize(String s) {
        return s.substring(0, 1).toUpperCase() + s.substring(1);
    }
}
