package com.lucaskalb.finance.controller;

import com.lucaskalb.finance.dto.CreateTransferCommand;
import com.lucaskalb.finance.exception.CategoryNotFoundException;
import com.lucaskalb.finance.exception.InvalidTransferException;
import com.lucaskalb.finance.exception.WalletNotFoundException;
import com.lucaskalb.finance.service.CategoryService;
import com.lucaskalb.finance.service.TransferService;
import com.lucaskalb.finance.service.WalletService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.time.LocalDate;

@Controller
@RequestMapping("/transfers")
@RequiredArgsConstructor
public class TransferController {

    private final TransferService transferService;
    private final WalletService walletService;
    private final CategoryService categoryService;

    @GetMapping("/new")
    public String newForm(Model model) {
        model.addAttribute("wallets", walletService.listActive());
        model.addAttribute("expenseCategories", categoryService.listActiveByType("EXPENSE"));
        model.addAttribute("incomeCategories", categoryService.listActiveByType("INCOME"));
        return "fragments/transfer-form :: form";
    }

    @PostMapping
    public String create(
            @RequestParam long fromWalletId,
            @RequestParam long toWalletId,
            @RequestParam long fromCategoryId,
            @RequestParam long toCategoryId,
            @RequestParam String amount,
            @RequestParam LocalDate occurredAt,
            @RequestParam(required = false) String description,
            Model model,
            HttpServletResponse response,
            HttpSession session
    ) {
        try {
            var amountCents = parseAmountToCents(amount);
            var command = new CreateTransferCommand(
                    fromWalletId,
                    toWalletId,
                    fromCategoryId,
                    toCategoryId,
                    amountCents,
                    occurredAt.atStartOfDay(),
                    description
            );
            transferService.create(command);
            session.setAttribute("successMessage", "Transferência criada com sucesso");
            response.setHeader("HX-Redirect", "/entries");
            return null;
        } catch (InvalidTransferException | WalletNotFoundException | CategoryNotFoundException e) {
            model.addAttribute("errorMessage", e.getMessage());
            addFormAttributes(model, fromWalletId, toWalletId, fromCategoryId, toCategoryId, amount, occurredAt, description);
            return "fragments/transfer-form :: form";
        }
    }

    private void addFormAttributes(Model model, long fromWalletId, long toWalletId,
                                   long fromCategoryId, long toCategoryId,
                                   String amount, LocalDate occurredAt, String description) {
        model.addAttribute("wallets", walletService.listActive());
        model.addAttribute("expenseCategories", categoryService.listActiveByType("EXPENSE"));
        model.addAttribute("incomeCategories", categoryService.listActiveByType("INCOME"));
        model.addAttribute("formFromWalletId", fromWalletId);
        model.addAttribute("formToWalletId", toWalletId);
        model.addAttribute("formFromCategoryId", fromCategoryId);
        model.addAttribute("formToCategoryId", toCategoryId);
        model.addAttribute("formAmount", amount);
        model.addAttribute("formOccurredAt", occurredAt);
        model.addAttribute("formDescription", description);
    }

    private long parseAmountToCents(String amount) {
        if (amount == null || amount.isBlank()) {
            throw new InvalidTransferException("Valor é obrigatório");
        }
        try {
            var normalized = amount.replace(",", ".").trim();
            var value = Double.parseDouble(normalized);
            return Math.round(value * 100);
        } catch (NumberFormatException e) {
            throw new InvalidTransferException("Valor inválido: " + amount);
        }
    }
}
