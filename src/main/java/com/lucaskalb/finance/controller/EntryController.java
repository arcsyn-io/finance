package com.lucaskalb.finance.controller;

import com.lucaskalb.finance.dto.BatchUpdateEntriesCommand;
import com.lucaskalb.finance.dto.CreateEntryCommand;
import com.lucaskalb.finance.dto.UpdateEntryCommand;
import com.lucaskalb.finance.exception.CategoryNotFoundException;
import com.lucaskalb.finance.exception.EntryNotFoundException;
import com.lucaskalb.finance.exception.InvalidEntryException;
import com.lucaskalb.finance.exception.InvalidTransferException;
import com.lucaskalb.finance.exception.WalletNotFoundException;
import com.lucaskalb.finance.model.EntryNature;
import com.lucaskalb.finance.model.Period;
import com.lucaskalb.finance.service.CategoryService;
import com.lucaskalb.finance.service.EntryService;
import com.lucaskalb.finance.service.TransferService;
import com.lucaskalb.finance.service.WalletService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.TextStyle;
import java.time.temporal.TemporalAdjusters;
import java.util.Locale;
import java.util.Map;

@Controller
@RequestMapping("/entries")
@RequiredArgsConstructor
public class EntryController {

    private final EntryService entryService;
    private final WalletService walletService;
    private final CategoryService categoryService;
    private final TransferService transferService;

    @GetMapping
    public String list(
            @RequestParam(required = false, defaultValue = "CURRENT_MONTH") Period period,
            @RequestParam(required = false, defaultValue = "0") int offset,
            @RequestParam(required = false) Long walletId,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) EntryNature nature,
            @RequestParam(name = "showDeleted", defaultValue = "false") boolean showDeleted,
            Model model,
            HttpSession session
    ) {
        var dateRange = calculateDateRange(period, offset);
        var entries = entryService.list(
                dateRange.start().atStartOfDay(),
                dateRange.end().atTime(LocalTime.MAX),
                walletId, categoryId, nature, showDeleted
        );

        model.addAttribute("title", "Lançamentos - Finance");
        model.addAttribute("entries", entries);
        model.addAttribute("wallets", walletService.listActive());
        model.addAttribute("categories", categoryService.listActive());
        model.addAttribute("natures", EntryNature.values());
        model.addAttribute("periods", Period.values());
        model.addAttribute("selectedPeriod", period);
        model.addAttribute("offset", offset);
        model.addAttribute("periodLabel", formatPeriodLabel(period, dateRange.start()));
        model.addAttribute("selectedWalletId", walletId);
        model.addAttribute("selectedCategoryId", categoryId);
        model.addAttribute("selectedNature", nature);
        model.addAttribute("showDeleted", showDeleted);

        var flashMessage = session.getAttribute("successMessage");
        if (flashMessage != null) {
            model.addAttribute("successMessage", flashMessage);
            session.removeAttribute("successMessage");
        }

        return "pages/entries";
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
        };
    }

    private String formatPeriodLabel(Period period, LocalDate date) {
        var locale = new Locale("pt", "BR");

        return switch (period) {
            case CURRENT_MONTH, PREVIOUS_MONTH -> {
                var month = date.getMonth().getDisplayName(TextStyle.FULL, locale);
                var capitalizedMonth = month.substring(0, 1).toUpperCase() + month.substring(1);
                yield capitalizedMonth + " " + date.getYear();
            }
            case THIS_WEEK -> {
                var endOfWeek = date.plusDays(6);
                yield String.format("%02d/%02d - %02d/%02d/%d",
                        date.getDayOfMonth(), date.getMonthValue(),
                        endOfWeek.getDayOfMonth(), endOfWeek.getMonthValue(), endOfWeek.getYear());
            }
            case TODAY, YESTERDAY -> String.format("%02d/%02d/%d",
                    date.getDayOfMonth(), date.getMonthValue(), date.getYear());
        };
    }

    @GetMapping("/new")
    public String newForm(Model model) {
        model.addAttribute("wallets", walletService.listActive());
        model.addAttribute("categories", categoryService.listActive());
        model.addAttribute("natures", EntryNature.values());
        model.addAttribute("isEdit", false);
        return "fragments/entry-form :: form";
    }

    @PostMapping
    public String create(
            @RequestParam long walletId,
            @RequestParam long categoryId,
            @RequestParam EntryNature nature,
            @RequestParam String amount,
            @RequestParam LocalDate occurredAt,
            @RequestParam(required = false) String description,
            Model model,
            HttpServletRequest request,
            HttpServletResponse response,
            HttpSession session
    ) {
        try {
            var amountCents = parseAmountToCents(amount);
            var command = new CreateEntryCommand(
                    walletId,
                    categoryId,
                    nature,
                    amountCents,
                    occurredAt.atStartOfDay(),
                    description
            );
            entryService.create(command);
            session.setAttribute("successMessage", "Lançamento criado com sucesso");
            response.setHeader("HX-Redirect", getEntriesRedirectUrl(request));
            return null;
        } catch (InvalidEntryException | WalletNotFoundException | CategoryNotFoundException e) {
            model.addAttribute("errorMessage", e.getMessage());
            addFormAttributes(model, walletId, categoryId, nature, amount, occurredAt, description, false);
            return "fragments/entry-form :: form";
        }
    }

    @GetMapping("/{id}/edit")
    public String editForm(@PathVariable long id, Model model, HttpServletResponse response) {
        try {
            var entry = entryService.findById(id);
            model.addAttribute("entry", entry);
            model.addAttribute("entryAmount", formatCentsToAmount(entry.getAmount()));
            model.addAttribute("wallets", walletService.listActive());
            model.addAttribute("categories", categoryService.listActive());
            model.addAttribute("natures", EntryNature.values());
            model.addAttribute("isEdit", true);
            return "fragments/entry-form :: form";
        } catch (EntryNotFoundException e) {
            response.setHeader("HX-Redirect", "/entries");
            return null;
        }
    }

    @PostMapping("/{id}")
    public String update(
            @PathVariable long id,
            @RequestParam long walletId,
            @RequestParam long categoryId,
            @RequestParam EntryNature nature,
            @RequestParam String amount,
            @RequestParam LocalDate occurredAt,
            @RequestParam(required = false) String description,
            Model model,
            HttpServletRequest request,
            HttpServletResponse response,
            HttpSession session
    ) {
        try {
            var amountCents = parseAmountToCents(amount);
            var command = new UpdateEntryCommand(
                    id,
                    walletId,
                    categoryId,
                    nature,
                    amountCents,
                    occurredAt.atStartOfDay(),
                    description
            );
            entryService.update(command);
            session.setAttribute("successMessage", "Lançamento atualizado com sucesso");
            response.setHeader("HX-Redirect", getEntriesRedirectUrl(request));
            return null;
        } catch (InvalidEntryException | WalletNotFoundException | CategoryNotFoundException e) {
            model.addAttribute("errorMessage", e.getMessage());
            model.addAttribute("entry", Map.of("id", id));
            addFormAttributes(model, walletId, categoryId, nature, amount, occurredAt, description, true);
            return "fragments/entry-form :: form";
        } catch (EntryNotFoundException e) {
            response.setHeader("HX-Redirect", getEntriesRedirectUrl(request));
            return null;
        }
    }

    @PostMapping("/{id}/delete")
    public String delete(@PathVariable long id, Model model) {
        try {
            entryService.delete(id);
            var entry = entryService.findById(id);
            model.addAttribute("entry", entry);
            return "fragments/entry-row :: row";
        } catch (EntryNotFoundException e) {
            return "fragments/entry-row :: empty";
        }
    }

    @PostMapping("/{id}/restore")
    public String restore(@PathVariable long id, Model model) {
        try {
            entryService.restore(id);
            var entry = entryService.findById(id);
            model.addAttribute("entry", entry);
            return "fragments/entry-row :: row";
        } catch (EntryNotFoundException e) {
            return "fragments/entry-row :: empty";
        }
    }

    @PostMapping("/batch")
    @ResponseBody
    public ResponseEntity<Void> batchUpdate(@RequestBody BatchUpdateEntriesCommand command) {
        entryService.batchUpdate(command);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/batch/delete")
    @ResponseBody
    public ResponseEntity<Void> batchDelete(@RequestBody java.util.List<Long> entryIds) {
        entryService.batchDelete(entryIds);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{id}/link")
    public String linkModal(@PathVariable long id, Model model) {
        try {
            var entry = entryService.findById(id);
            var candidates = entryService.findLinkCandidates(id, true, true);
            var wallets = walletService.listActive();

            model.addAttribute("entry", entry);
            model.addAttribute("entryAmount", formatCentsToAmount(entry.getAmount()));
            model.addAttribute("candidates", candidates);
            model.addAttribute("wallets", wallets);
            model.addAttribute("categories", categoryService.listActive());
            model.addAttribute("natures", EntryNature.values());
            model.addAttribute("filterAmount", true);
            model.addAttribute("filterDate", true);

            return "fragments/link-modal :: modal";
        } catch (EntryNotFoundException e) {
            return "fragments/link-modal :: error";
        }
    }

    @GetMapping("/{id}/link/candidates")
    public String linkCandidates(
            @PathVariable long id,
            @RequestParam(required = false, defaultValue = "true") boolean filterAmount,
            @RequestParam(required = false, defaultValue = "true") boolean filterDate,
            @RequestParam(required = false) Long walletId,
            Model model
    ) {
        try {
            var entry = entryService.findById(id);
            var candidates = entryService.findLinkCandidates(id, filterAmount, filterDate, walletId);

            model.addAttribute("entry", entry);
            model.addAttribute("candidates", candidates);

            return "fragments/link-modal :: candidates";
        } catch (EntryNotFoundException e) {
            return "fragments/link-modal :: error";
        }
    }

    @PostMapping("/{id}/link")
    public String link(
            @PathVariable long id,
            @RequestParam long targetEntryId,
            HttpServletRequest request,
            HttpServletResponse response,
            HttpSession session
    ) {
        try {
            transferService.linkEntries(id, targetEntryId);
            session.setAttribute("successMessage", "Lançamentos vinculados como transferência");
            response.setHeader("HX-Redirect", getEntriesRedirectUrl(request));
            return null;
        } catch (InvalidTransferException e) {
            response.setHeader("HX-Retarget", "#linkError");
            response.setHeader("HX-Reswap", "innerHTML");
            return "fragments/link-modal :: errorMessage(message='" + e.getMessage() + "')";
        }
    }

    @PostMapping("/{id}/link/create")
    public String linkCreate(
            @PathVariable long id,
            @RequestParam long walletId,
            @RequestParam long categoryId,
            @RequestParam EntryNature nature,
            @RequestParam(required = false) String description,
            HttpServletRequest request,
            HttpServletResponse response,
            HttpSession session
    ) {
        try {
            transferService.createAndLink(id, walletId, categoryId, nature, description);
            session.setAttribute("successMessage", "Lançamento criado e vinculado como transferência");
            response.setHeader("HX-Redirect", getEntriesRedirectUrl(request));
            return null;
        } catch (InvalidTransferException e) {
            response.setHeader("HX-Retarget", "#linkError");
            response.setHeader("HX-Reswap", "innerHTML");
            return "fragments/link-modal :: errorMessage(message='" + e.getMessage() + "')";
        }
    }

    private void addFormAttributes(Model model, long walletId, long categoryId, EntryNature nature,
                                   String amount, LocalDate occurredAt, String description, boolean isEdit) {
        model.addAttribute("wallets", walletService.listActive());
        model.addAttribute("categories", categoryService.listActive());
        model.addAttribute("natures", EntryNature.values());
        model.addAttribute("formWalletId", walletId);
        model.addAttribute("formCategoryId", categoryId);
        model.addAttribute("formNature", nature);
        model.addAttribute("formAmount", amount);
        model.addAttribute("formOccurredAt", occurredAt);
        model.addAttribute("formDescription", description);
        model.addAttribute("isEdit", isEdit);
    }

    private String getEntriesRedirectUrl(HttpServletRequest request) {
        var currentUrl = request.getHeader("HX-Current-URL");
        if (currentUrl != null) {
            try {
                var uri = java.net.URI.create(currentUrl);
                var query = uri.getRawQuery();
                if (query != null) {
                    return "/entries?" + query;
                }
            } catch (Exception ignored) {}
        }
        return "/entries";
    }

    private long parseAmountToCents(String amount) {
        if (amount == null || amount.isBlank()) {
            throw new InvalidEntryException("Valor é obrigatório");
        }
        try {
            var normalized = amount.replace(",", ".").trim();
            var value = Double.parseDouble(normalized);
            return Math.round(value * 100);
        } catch (NumberFormatException e) {
            throw new InvalidEntryException("Valor inválido: " + amount);
        }
    }

    private String formatCentsToAmount(long cents) {
        return String.format("%.2f", cents / 100.0).replace(".", ",");
    }
}
