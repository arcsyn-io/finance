package com.lucaskalb.finance.controller;

import com.lucaskalb.finance.exception.InvalidPasswordException;
import com.lucaskalb.finance.exception.InvalidUsernameException;
import com.lucaskalb.finance.exception.UsernameAlreadyExistsException;
import com.lucaskalb.finance.service.AccountService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
@RequiredArgsConstructor
public class SignupController {

    private final AccountService accountService;

    @GetMapping("/signup")
    public String signup() {
        return "pages/signup";
    }

    @PostMapping("/signup")
    public String createAccount(
            @RequestParam String username,
            @RequestParam String password,
            @RequestParam String confirmationPassword,
            Model model,
            RedirectAttributes redirectAttributes) {

        if (!password.equals(confirmationPassword)) {
            model.addAttribute("error", "As senhas não coincidem");
            model.addAttribute("username", username);
            return "pages/signup";
        }

        try {
            accountService.createAccount(username, password);
            redirectAttributes.addFlashAttribute("successMessage", "Conta criada com sucesso! Faça login.");
            return "redirect:/login";
        } catch (InvalidUsernameException | InvalidPasswordException | UsernameAlreadyExistsException e) {
            model.addAttribute("error", e.getMessage());
            model.addAttribute("username", username);
            return "pages/signup";
        }
    }
}
