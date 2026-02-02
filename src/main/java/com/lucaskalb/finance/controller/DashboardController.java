package com.lucaskalb.finance.controller;

import com.lucaskalb.finance.service.EntryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

import java.time.LocalDate;
import java.time.format.TextStyle;
import java.util.Locale;

@Controller
@RequiredArgsConstructor
public class DashboardController {

    private final EntryService entryService;

    @GetMapping("/dashboard")
    public String dashboard(Model model) {
        model.addAttribute("title", "Dashboard - Finance");

        // Saldos por tipo de carteira
        var cashBalance = entryService.calculateCashBalance();
        var liquidBalance = entryService.calculateLiquidBalance();
        var fixedBalance = entryService.calculateFixedBalance();
        var netWorth = entryService.calculateNetWorth();

        model.addAttribute("cashBalance", cashBalance);
        model.addAttribute("liquidBalance", liquidBalance);
        model.addAttribute("fixedBalance", fixedBalance);
        model.addAttribute("netWorth", netWorth);

        // Periodo do mes atual
        var now = LocalDate.now();
        var startOfMonth = now.withDayOfMonth(1).atStartOfDay();
        var endOfMonth = now.withDayOfMonth(now.lengthOfMonth()).atTime(23, 59, 59);

        // Receitas e despesas do mes
        var monthIncome = entryService.calculatePeriodIncome(startOfMonth, endOfMonth);
        var monthExpense = entryService.calculatePeriodExpense(startOfMonth, endOfMonth);
        model.addAttribute("monthIncome", monthIncome);
        model.addAttribute("monthExpense", monthExpense);

        // Nome do mes atual
        var monthName = now.getMonth().getDisplayName(TextStyle.FULL, new Locale("pt", "BR"));
        var capitalizedMonth = monthName.substring(0, 1).toUpperCase() + monthName.substring(1);
        model.addAttribute("currentMonth", capitalizedMonth + " " + now.getYear());

        // Ultimas transacoes
        var latestEntries = entryService.listLatest(10);
        model.addAttribute("latestEntries", latestEntries);

        return "pages/dashboard";
    }
}
