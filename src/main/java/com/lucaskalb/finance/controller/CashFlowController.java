package com.lucaskalb.finance.controller;

import com.lucaskalb.finance.dto.UpdateCashFlowConfigCommand;
import com.lucaskalb.finance.model.EntryDirection;
import com.lucaskalb.finance.model.EntryNature;
import com.lucaskalb.finance.service.CashFlowService;
import com.lucaskalb.finance.service.CategoryService;
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

import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.time.Year;
import java.time.YearMonth;

@Controller
@RequestMapping("/cash-flow")
@RequiredArgsConstructor
public class CashFlowController {

    private final CashFlowService cashFlowService;
    private final EntryService entryService;
    private final WalletService walletService;
    private final CategoryService categoryService;

    @GetMapping
    public String show(
            @RequestParam(required = false) Integer year,
            Model model,
            HttpSession session
    ) {
        var selectedYear = year != null ? year : Year.now().getValue();
        var annualCashFlow = cashFlowService.getAnnualCashFlow(selectedYear);

        model.addAttribute("title", "Fluxo de Caixa - Finance");
        model.addAttribute("annualCashFlow", annualCashFlow);
        model.addAttribute("selectedYear", selectedYear);
        model.addAttribute("prevYear", selectedYear - 1);
        model.addAttribute("nextYear", selectedYear + 1);

        // Dados para os gráficos (já convertidos para evitar problemas de serialização)
        model.addAttribute("chartReceipts", annualCashFlow.months().stream()
                .map(m -> m.totalReceipts() / 100.0).toList());
        model.addAttribute("chartExpenses", annualCashFlow.months().stream()
                .map(m -> m.totalExpenses() / 100.0).toList());
        model.addAttribute("chartNetCashFlow", annualCashFlow.months().stream()
                .map(m -> m.netCashFlow() / 100.0).toList());
        model.addAttribute("chartSurplus", annualCashFlow.months().stream()
                .map(m -> m.surplusOrDeficit() / 100.0).toList());

        model.addAttribute("opInCategories",
                cashFlowService.getOperationalCategoryRows(selectedYear, EntryDirection.IN));
        model.addAttribute("opOutCategories",
                cashFlowService.getOperationalCategoryRows(selectedYear, EntryDirection.OUT));

        model.addAttribute("nonOpInCategories",
                cashFlowService.getNonOperationalCategoryRows(selectedYear, EntryDirection.IN));
        model.addAttribute("nonOpOutCategories",
                cashFlowService.getNonOperationalCategoryRows(selectedYear, EntryDirection.OUT));

        var flashMessage = session.getAttribute("successMessage");
        if (flashMessage != null) {
            model.addAttribute("successMessage", flashMessage);
            session.removeAttribute("successMessage");
        }

        return "pages/cash-flow";
    }

    @GetMapping("/entries")
    public String entries(
            @RequestParam String month,
            @RequestParam EntryDirection direction,
            Model model
    ) {
        var referenceMonth = YearMonth.parse(month);
        var entries = cashFlowService.listMonthlyEntries(referenceMonth, direction);
        var totalAmount = entries.stream().mapToLong(e -> e.getAmount()).sum();

        var label = direction == EntryDirection.IN ? "Recebimentos" : "Despesas";

        model.addAttribute("entries", entries);
        model.addAttribute("totalAmount", totalAmount);
        model.addAttribute("modalTitle", label + " - " + formatMonthLabel(referenceMonth));
        model.addAttribute("month", month);
        model.addAttribute("direction", direction);

        return "fragments/cash-flow-entries-modal :: modal";
    }

    @GetMapping("/op-entries")
    public String opEntries(
            @RequestParam String month,
            @RequestParam EntryDirection direction,
            @RequestParam long categoryId,
            Model model
    ) {
        var referenceMonth = YearMonth.parse(month);
        var entries = cashFlowService.listOperationalMonthlyEntries(referenceMonth, direction, categoryId);
        var totalAmount = entries.stream().mapToLong(e -> e.getAmount()).sum();

        var categoryName = entries.isEmpty() ? "" : entries.getFirst().getCategoryName();

        model.addAttribute("entries", entries);
        model.addAttribute("totalAmount", totalAmount);
        model.addAttribute("modalTitle", categoryName + " - " + formatMonthLabel(referenceMonth));
        model.addAttribute("month", month);
        model.addAttribute("direction", direction);

        return "fragments/cash-flow-entries-modal :: modal";
    }

    @GetMapping("/non-op-entries")
    public String nonOpEntries(
            @RequestParam String month,
            @RequestParam EntryDirection direction,
            @RequestParam long categoryId,
            Model model
    ) {
        var referenceMonth = YearMonth.parse(month);
        var entries = cashFlowService.listNonOperationalMonthlyEntries(referenceMonth, direction, categoryId);
        var totalAmount = entries.stream().mapToLong(e -> e.getAmount()).sum();

        var categoryName = entries.isEmpty() ? "" : entries.getFirst().getCategoryName();

        model.addAttribute("entries", entries);
        model.addAttribute("totalAmount", totalAmount);
        model.addAttribute("modalTitle", categoryName + " - " + formatMonthLabel(referenceMonth));
        model.addAttribute("month", month);
        model.addAttribute("direction", direction);

        return "fragments/cash-flow-entries-modal :: modal";
    }

    @GetMapping("/entries/{entryId}/edit-inline")
    public String editEntryInline(
            @PathVariable long entryId,
            @RequestParam String month,
            @RequestParam EntryDirection direction,
            Model model
    ) {
        var entry = entryService.findById(entryId);
        model.addAttribute("entry", entry);
        model.addAttribute("categories", categoryService.listActive());
        model.addAttribute("wallets", walletService.listActive());
        model.addAttribute("month", month);
        model.addAttribute("direction", direction);

        return "fragments/cash-flow-entry-row :: editRow";
    }

    @GetMapping("/entries/{entryId}/row")
    public String entryRow(
            @PathVariable long entryId,
            @RequestParam String month,
            @RequestParam EntryDirection direction,
            Model model
    ) {
        var entry = entryService.findById(entryId);
        model.addAttribute("entry", entry);
        model.addAttribute("month", month);
        model.addAttribute("direction", direction);

        return "fragments/cash-flow-entry-row :: entryRow";
    }

    @PostMapping("/entries/{entryId}")
    public String updateEntry(
            @PathVariable long entryId,
            @RequestParam long walletId,
            @RequestParam long categoryId,
            @RequestParam(required = false) String description,
            @RequestParam String month,
            @RequestParam EntryDirection direction,
            Model model
    ) {
        var referenceMonth = YearMonth.parse(month);

        try {
            var entry = entryService.findById(entryId);
            entryService.updateFields(entryId, walletId, categoryId, entry.getNature(), entry.getEconomicEvent(), description);
        } catch (Exception e) {
            model.addAttribute("errorMessage", e.getMessage());
        }

        var entries = cashFlowService.listMonthlyEntries(referenceMonth, direction);
        var totalAmount = entries.stream().mapToLong(e -> e.getAmount()).sum();
        var label = direction == EntryDirection.IN ? "Recebimentos" : "Despesas";

        model.addAttribute("entries", entries);
        model.addAttribute("totalAmount", totalAmount);
        model.addAttribute("modalTitle", label + " - " + formatMonthLabel(referenceMonth));
        model.addAttribute("month", month);
        model.addAttribute("direction", direction);

        return "fragments/cash-flow-entries-modal :: modalBody";
    }

    @GetMapping("/edit")
    public String editConfig(@RequestParam String month, Model model) {
        var referenceMonth = YearMonth.parse(month);
        var cashFlow = cashFlowService.getMonthlyCashFlow(referenceMonth);

        model.addAttribute("month", month);
        model.addAttribute("monthLabel", formatMonthLabel(referenceMonth));
        model.addAttribute("openingBalance", formatCentsToAmount(cashFlow.openingBalance()));
        model.addAttribute("minimumCash", formatCentsToAmount(cashFlow.minimumCash()));

        return "fragments/cash-flow-config-form :: form";
    }

    @PostMapping("/config")
    public String updateConfig(
            @RequestParam String month,
            @RequestParam String openingBalance,
            @RequestParam String minimumCash,
            @RequestParam(required = false, defaultValue = "false") boolean applyToFollowingMonths,
            HttpServletResponse response,
            HttpSession session
    ) {
        var referenceMonth = YearMonth.parse(month);
        var openingBalanceCents = parseAmountToCents(openingBalance);
        var minimumCashCents = parseAmountToCents(minimumCash);

        var command = new UpdateCashFlowConfigCommand(
                referenceMonth,
                openingBalanceCents,
                minimumCashCents
        );

        if (applyToFollowingMonths) {
            cashFlowService.updateCashFlowConfigForFollowingMonths(command);
        } else {
            cashFlowService.updateCashFlowConfig(command);
        }

        session.setAttribute("successMessage", "Configuração atualizada com sucesso");
        response.setHeader("HX-Redirect", "/cash-flow?year=" + referenceMonth.getYear());
        return null;
    }

    private String formatMonthLabel(YearMonth month) {
        var monthNames = new String[]{"Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
                "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"};
        return monthNames[month.getMonthValue() - 1] + " " + month.getYear();
    }

    private long parseAmountToCents(String amount) {
        if (amount == null || amount.isBlank()) {
            return 0L;
        }
        try {
            var normalized = amount.replace(",", ".").trim();
            var value = Double.parseDouble(normalized);
            return Math.round(value * 100);
        } catch (NumberFormatException e) {
            return 0L;
        }
    }

    private String formatCentsToAmount(long cents) {
        return String.format("%.2f", cents / 100.0).replace(".", ",");
    }
}
