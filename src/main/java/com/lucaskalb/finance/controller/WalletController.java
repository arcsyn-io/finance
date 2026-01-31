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
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
@RequestMapping("/wallets")
@RequiredArgsConstructor
public class WalletController {

    private final WalletService walletService;

    @GetMapping
    public String list(
            @RequestParam(name = "showInactive", defaultValue = "false") boolean showInactive,
            Model model
    ) {
        var wallets = showInactive
                ? walletService.listAll()
                : walletService.listActive();

        model.addAttribute("title", "Carteiras - Finance");
        model.addAttribute("wallets", wallets);
        model.addAttribute("showInactive", showInactive);
        model.addAttribute("walletTypes", WalletType.values());
        return "pages/wallets";
    }

    @GetMapping("/new")
    public String newForm(Model model) {
        model.addAttribute("title", "Nova Carteira - Finance");
        model.addAttribute("walletTypes", WalletType.values());
        model.addAttribute("isEdit", false);
        return "pages/wallet-form";
    }

    @PostMapping
    public String create(
            @RequestParam String name,
            @RequestParam WalletType type,
            RedirectAttributes redirectAttributes
    ) {
        try {
            var command = new CreateWalletCommand(name, type);
            walletService.create(command);
            redirectAttributes.addFlashAttribute("successMessage", "Carteira criada com sucesso");
            return "redirect:/wallets";
        } catch (InvalidWalletException | DuplicateWalletNameException e) {
            redirectAttributes.addFlashAttribute("errorMessage", e.getMessage());
            return "redirect:/wallets/new";
        }
    }

    @GetMapping("/{id}")
    public String editForm(@PathVariable long id, Model model, RedirectAttributes redirectAttributes) {
        try {
            var wallet = walletService.findById(id);
            model.addAttribute("title", "Editar Carteira - Finance");
            model.addAttribute("wallet", wallet);
            model.addAttribute("walletTypes", WalletType.values());
            model.addAttribute("isEdit", true);
            return "pages/wallet-form";
        } catch (WalletNotFoundException e) {
            redirectAttributes.addFlashAttribute("errorMessage", e.getMessage());
            return "redirect:/wallets";
        }
    }

    @PostMapping("/{id}")
    public String update(
            @PathVariable long id,
            @RequestParam String name,
            @RequestParam WalletType type,
            @RequestParam(defaultValue = "false") boolean active,
            RedirectAttributes redirectAttributes
    ) {
        try {
            var command = new UpdateWalletCommand(id, name, type, active);
            walletService.update(command);
            redirectAttributes.addFlashAttribute("successMessage", "Carteira atualizada com sucesso");
            return "redirect:/wallets";
        } catch (WalletNotFoundException e) {
            redirectAttributes.addFlashAttribute("errorMessage", e.getMessage());
            return "redirect:/wallets";
        } catch (InvalidWalletException | DuplicateWalletNameException e) {
            redirectAttributes.addFlashAttribute("errorMessage", e.getMessage());
            return "redirect:/wallets/" + id;
        }
    }

    @PostMapping("/{id}/deactivate")
    public String deactivate(@PathVariable long id, RedirectAttributes redirectAttributes) {
        try {
            walletService.deactivate(id);
            redirectAttributes.addFlashAttribute("successMessage", "Carteira desativada com sucesso");
        } catch (WalletNotFoundException e) {
            redirectAttributes.addFlashAttribute("errorMessage", e.getMessage());
        }
        return "redirect:/wallets";
    }

    @PostMapping("/{id}/activate")
    public String activate(@PathVariable long id, RedirectAttributes redirectAttributes) {
        try {
            walletService.activate(id);
            redirectAttributes.addFlashAttribute("successMessage", "Carteira ativada com sucesso");
        } catch (WalletNotFoundException e) {
            redirectAttributes.addFlashAttribute("errorMessage", e.getMessage());
        }
        return "redirect:/wallets";
    }

    @PostMapping("/{id}/deactivate-htmx")
    public String deactivateHtmx(@PathVariable long id, Model model) {
        try {
            walletService.deactivate(id);
            var wallet = walletService.findById(id);
            model.addAttribute("wallet", wallet);
            return "fragments/wallet-row :: row";
        } catch (WalletNotFoundException e) {
            return "fragments/wallet-row :: empty";
        }
    }

    @PostMapping("/{id}/activate-htmx")
    public String activateHtmx(@PathVariable long id, Model model) {
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
