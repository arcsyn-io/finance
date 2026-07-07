package com.lucaskalb.finance.controller;

import com.lucaskalb.finance.dto.CreateWalletCommand;
import com.lucaskalb.finance.dto.UpdateWalletCommand;
import com.lucaskalb.finance.exception.DuplicateWalletNameException;
import com.lucaskalb.finance.exception.InvalidWalletException;
import com.lucaskalb.finance.exception.WalletNotFoundException;
import com.lucaskalb.finance.model.EntryDirection;
import com.lucaskalb.finance.model.Period;
import com.lucaskalb.finance.model.WalletType;
import com.lucaskalb.finance.service.EntryService;
import com.lucaskalb.finance.service.WalletService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.TextStyle;
import java.time.temporal.TemporalAdjusters;
import java.util.Locale;
import java.util.Map;

@Controller
@RequestMapping("/wallets")
@RequiredArgsConstructor
public class WalletController {

    private final WalletService walletService;
    private final EntryService entryService;

    @GetMapping
    public String list(
            @RequestParam(name = "showInactive", defaultValue = "false") boolean showInactive,
            Model model,
            HttpSession session
    ) {
        var wallets = showInactive
                ? walletService.listAll()
                : walletService.listActive();
        var balances = walletService.getBalances();

        model.addAttribute("title", "Carteiras - Finance");
        model.addAttribute("wallets", wallets);
        model.addAttribute("balances", balances);
        model.addAttribute("showInactive", showInactive);
        model.addAttribute("walletTypes", WalletType.values());

        var flashMessage = session.getAttribute("successMessage");
        if (flashMessage != null) {
            model.addAttribute("successMessage", flashMessage);
            session.removeAttribute("successMessage");
        }

        return "pages/wallets";
    }

    @GetMapping("/{id}")
    public String view(
            @PathVariable long id,
            @RequestParam(required = false, defaultValue = "CURRENT_MONTH") Period period,
            @RequestParam(required = false, defaultValue = "0") int offset,
            @RequestParam(required = false) LocalDate customStart,
            @RequestParam(required = false) LocalDate customEnd,
            Model model
    ) {
        try {
            var wallet = walletService.findById(id);
            var balance = walletService.getBalance(id);

            var dateRange = period == Period.CUSTOM && customStart != null && customEnd != null
                    ? new DateRange(customStart, customEnd)
                    : calculateDateRange(period, offset);
            var startDateTime = dateRange.start().atStartOfDay();
            var endDateTime = dateRange.end().atTime(LocalTime.MAX);
            var entries = entryService.list(startDateTime, endDateTime, id, null, null, false);

            var totalIn = entries.stream()
                    .filter(e -> e.getDirection() == EntryDirection.IN)
                    .mapToLong(e -> e.getAmount()).sum();
            var totalOut = entries.stream()
                    .filter(e -> e.getDirection() == EntryDirection.OUT)
                    .mapToLong(e -> e.getAmount()).sum();
            var periodBalance = totalIn - totalOut;

            model.addAttribute("title", wallet.getName() + " - Finance");
            model.addAttribute("wallet", wallet);
            model.addAttribute("balance", balance);
            model.addAttribute("entries", entries);
            model.addAttribute("totalIn", totalIn);
            model.addAttribute("totalOut", totalOut);
            model.addAttribute("periodBalance", periodBalance);
            model.addAttribute("periodBalanceAbs", Math.abs(periodBalance));
            model.addAttribute("periods", Period.values());
            model.addAttribute("selectedPeriod", period);
            model.addAttribute("offset", offset);
            model.addAttribute("periodLabel", formatPeriodLabel(period, dateRange.start(), dateRange.end()));
            model.addAttribute("customStart", period == Period.CUSTOM ? dateRange.start() : null);
            model.addAttribute("customEnd", period == Period.CUSTOM ? dateRange.end() : null);

            return "pages/wallet";
        } catch (WalletNotFoundException e) {
            return "redirect:/wallets";
        }
    }

    @GetMapping("/new")
    public String newForm(Model model) {
        model.addAttribute("walletTypes", WalletType.values());
        model.addAttribute("isEdit", false);
        return "fragments/wallet-form :: form";
    }

    @PostMapping
    public String create(
            @RequestParam String name,
            @RequestParam WalletType type,
            Model model,
            HttpServletResponse response,
            HttpSession session
    ) {
        try {
            var command = new CreateWalletCommand(name, type);
            walletService.create(command);
            session.setAttribute("successMessage", "Carteira criada com sucesso");
            response.setHeader("HX-Redirect", "/wallets");
            return null;
        } catch (InvalidWalletException | DuplicateWalletNameException e) {
            model.addAttribute("errorMessage", e.getMessage());
            model.addAttribute("walletTypes", WalletType.values());
            model.addAttribute("isEdit", false);
            model.addAttribute("formName", name);
            model.addAttribute("formType", type);
            return "fragments/wallet-form :: form";
        }
    }

    @GetMapping("/{id}/edit")
    public String editForm(@PathVariable long id, Model model, HttpServletResponse response) {
        try {
            var wallet = walletService.findById(id);
            model.addAttribute("wallet", wallet);
            model.addAttribute("walletTypes", WalletType.values());
            model.addAttribute("isEdit", true);
            return "fragments/wallet-form :: form";
        } catch (WalletNotFoundException e) {
            response.setHeader("HX-Redirect", "/wallets");
            return null;
        }
    }

    @PostMapping("/{id}")
    public String update(
            @PathVariable long id,
            @RequestParam String name,
            @RequestParam WalletType type,
            @RequestParam(defaultValue = "false") boolean active,
            Model model,
            HttpServletResponse response,
            HttpSession session
    ) {
        try {
            var command = new UpdateWalletCommand(id, name, type, active);
            walletService.update(command);
            session.setAttribute("successMessage", "Carteira atualizada com sucesso");
            response.setHeader("HX-Redirect", "/wallets");
            return null;
        } catch (InvalidWalletException | DuplicateWalletNameException e) {
            model.addAttribute("errorMessage", e.getMessage());
            model.addAttribute("formName", name);
            model.addAttribute("formType", type);
            model.addAttribute("wallet", Map.of("id", id, "active", active));
            model.addAttribute("walletTypes", WalletType.values());
            model.addAttribute("isEdit", true);
            return "fragments/wallet-form :: form";
        } catch (WalletNotFoundException e) {
            response.setHeader("HX-Redirect", "/wallets");
            return null;
        }
    }

    @PostMapping("/{id}/deactivate")
    public String deactivate(@PathVariable long id, Model model) {
        try {
            walletService.deactivate(id);
            var wallet = walletService.findById(id);
            var balance = walletService.getBalance(id);
            model.addAttribute("wallet", wallet);
            model.addAttribute("balance", balance);
            return "fragments/wallet-row :: row";
        } catch (WalletNotFoundException e) {
            return "fragments/wallet-row :: empty";
        }
    }

    @PostMapping("/{id}/activate")
    public String activate(@PathVariable long id, Model model) {
        try {
            walletService.activate(id);
            var wallet = walletService.findById(id);
            var balance = walletService.getBalance(id);
            model.addAttribute("wallet", wallet);
            model.addAttribute("balance", balance);
            return "fragments/wallet-row :: row";
        } catch (WalletNotFoundException e) {
            return "fragments/wallet-row :: empty";
        }
    }

    private record DateRange(LocalDate start, LocalDate end) {}

    private DateRange calculateDateRange(Period period, int offset) {
        var today = LocalDate.now();

        return switch (period) {
            case CURRENT_MONTH, PREVIOUS_MONTH -> {
                var baseMonth = period == Period.CURRENT_MONTH ? today : today.minusMonths(1);
                var targetMonth = baseMonth.plusMonths(offset);
                var start = targetMonth.with(TemporalAdjusters.firstDayOfMonth());
                var end = targetMonth.with(TemporalAdjusters.lastDayOfMonth());
                yield new DateRange(start, end);
            }
            case THIS_WEEK -> {
                var baseWeekStart = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
                var targetWeekStart = baseWeekStart.plusWeeks(offset);
                var targetWeekEnd = targetWeekStart.plusDays(6);
                yield new DateRange(targetWeekStart, targetWeekEnd);
            }
            case TODAY -> {
                var targetDay = today.plusDays(offset);
                yield new DateRange(targetDay, targetDay);
            }
            case YESTERDAY -> {
                var baseDay = today.minusDays(1);
                var targetDay = baseDay.plusDays(offset);
                yield new DateRange(targetDay, targetDay);
            }
            case CUSTOM -> {
                var start = today.with(TemporalAdjusters.firstDayOfMonth());
                var end = today.with(TemporalAdjusters.lastDayOfMonth());
                yield new DateRange(start, end);
            }
        };
    }

    private String formatPeriodLabel(Period period, LocalDate start, LocalDate end) {
        var locale = new Locale("pt", "BR");

        return switch (period) {
            case CURRENT_MONTH, PREVIOUS_MONTH -> {
                var month = start.getMonth().getDisplayName(TextStyle.FULL, locale);
                var capitalizedMonth = month.substring(0, 1).toUpperCase() + month.substring(1);
                yield capitalizedMonth + " " + start.getYear();
            }
            case THIS_WEEK -> String.format("%02d/%02d - %02d/%02d/%d",
                    start.getDayOfMonth(), start.getMonthValue(),
                    end.getDayOfMonth(), end.getMonthValue(), end.getYear());
            case TODAY, YESTERDAY -> String.format("%02d/%02d/%d",
                    start.getDayOfMonth(), start.getMonthValue(), start.getYear());
            case CUSTOM -> String.format("%02d/%02d/%d - %02d/%02d/%d",
                    start.getDayOfMonth(), start.getMonthValue(), start.getYear(),
                    end.getDayOfMonth(), end.getMonthValue(), end.getYear());
        };
    }
}
