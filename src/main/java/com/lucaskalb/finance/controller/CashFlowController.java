package com.lucaskalb.finance.controller;

import com.lucaskalb.finance.dto.UpdateCashFlowConfigCommand;
import com.lucaskalb.finance.service.CashFlowService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.time.Year;
import java.time.YearMonth;
import java.util.List;

@Controller
@RequestMapping("/cash-flow")
@RequiredArgsConstructor
public class CashFlowController {

    private final CashFlowService cashFlowService;

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

        var flashMessage = session.getAttribute("successMessage");
        if (flashMessage != null) {
            model.addAttribute("successMessage", flashMessage);
            session.removeAttribute("successMessage");
        }

        return "pages/cash-flow";
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
