package com.lucaskalb.finance.controller;

import com.lucaskalb.finance.dto.CreateWalletCommand;
import com.lucaskalb.finance.dto.UpdateWalletCommand;
import com.lucaskalb.finance.exception.DuplicateWalletNameException;
import com.lucaskalb.finance.exception.InvalidWalletException;
import com.lucaskalb.finance.exception.WalletNotFoundException;
import com.lucaskalb.finance.model.WalletType;
import com.lucaskalb.finance.service.EntryService;
import com.lucaskalb.finance.service.WalletService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

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
    public String view(@PathVariable long id, Model model) {
        try {
            var wallet = walletService.findById(id);
            var balance = walletService.getBalance(id);
            var entries = entryService.list(null, null, id, null, null, false);

            model.addAttribute("title", wallet.getName() + " - Finance");
            model.addAttribute("wallet", wallet);
            model.addAttribute("balance", balance);
            model.addAttribute("entries", entries);

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
}
