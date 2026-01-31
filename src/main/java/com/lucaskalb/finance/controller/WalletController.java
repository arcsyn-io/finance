package com.lucaskalb.finance.controller;

import com.lucaskalb.finance.dto.CreateWalletCommand;
import com.lucaskalb.finance.dto.UpdateWalletCommand;
import com.lucaskalb.finance.exception.DuplicateWalletNameException;
import com.lucaskalb.finance.exception.InvalidWalletException;
import com.lucaskalb.finance.exception.WalletNotFoundException;
import com.lucaskalb.finance.model.WalletType;
import com.lucaskalb.finance.service.WalletService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletResponse;

import java.util.Map;

@Controller
@RequestMapping("/wallets")
@RequiredArgsConstructor
public class WalletController {

    private final WalletService walletService;

    @GetMapping
    public String list(
            @RequestParam(name = "showInactive", defaultValue = "false") boolean showInactive,
            @RequestParam(name = "success", required = false) String success,
            Model model
    ) {
        var wallets = showInactive
                ? walletService.listAll()
                : walletService.listActive();

        model.addAttribute("title", "Carteiras - Finance");
        model.addAttribute("wallets", wallets);
        model.addAttribute("showInactive", showInactive);
        model.addAttribute("walletTypes", WalletType.values());

        if ("created".equals(success)) {
            model.addAttribute("successMessage", "Carteira criada com sucesso");
        } else if ("updated".equals(success)) {
            model.addAttribute("successMessage", "Carteira atualizada com sucesso");
        }

        return "pages/wallets";
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
            HttpServletResponse response
    ) {
        try {
            var command = new CreateWalletCommand(name, type);
            walletService.create(command);
            response.setHeader("HX-Redirect", "/wallets?success=created");
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
            HttpServletResponse response
    ) {
        try {
            var command = new UpdateWalletCommand(id, name, type, active);
            walletService.update(command);
            response.setHeader("HX-Redirect", "/wallets?success=updated");
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
            model.addAttribute("wallet", wallet);
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
            model.addAttribute("wallet", wallet);
            return "fragments/wallet-row :: row";
        } catch (WalletNotFoundException e) {
            return "fragments/wallet-row :: empty";
        }
    }
}
