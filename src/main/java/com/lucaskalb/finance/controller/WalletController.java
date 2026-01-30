package com.lucaskalb.finance.controller;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/wallets")
public class WalletController {

    @GetMapping
    public String list(Model model) {
        model.addAttribute("title", "Carteiras - Finance");
        return "pages/wallets";
    }
}
