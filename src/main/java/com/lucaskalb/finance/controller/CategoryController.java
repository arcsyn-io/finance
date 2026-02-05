package com.lucaskalb.finance.controller;

import com.lucaskalb.finance.dto.CreateCategoryCommand;
import com.lucaskalb.finance.dto.UpdateCategoryCommand;
import com.lucaskalb.finance.exception.CategoryNotFoundException;
import com.lucaskalb.finance.exception.DuplicateCategoryNameException;
import com.lucaskalb.finance.exception.InvalidCategoryException;
import com.lucaskalb.finance.model.CategoryType;
import com.lucaskalb.finance.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.util.Map;

@Controller
@RequestMapping("/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    @GetMapping
    public String list(
            @RequestParam(name = "showInactive", defaultValue = "false") boolean showInactive,
            Model model,
            HttpSession session
    ) {
        var categories = showInactive
                ? categoryService.listAll()
                : categoryService.listActive();

        var incomeCategories = categories.stream()
                .filter(c -> c.getType() == CategoryType.INCOME)
                .toList();
        var expenseCategories = categories.stream()
                .filter(c -> c.getType() == CategoryType.EXPENSE)
                .toList();

        model.addAttribute("title", "Categorias - Finance");
        model.addAttribute("incomeCategories", incomeCategories);
        model.addAttribute("expenseCategories", expenseCategories);
        model.addAttribute("showInactive", showInactive);
        model.addAttribute("categoryTypes", CategoryType.values());

        var flashMessage = session.getAttribute("successMessage");
        if (flashMessage != null) {
            model.addAttribute("successMessage", flashMessage);
            session.removeAttribute("successMessage");
        }

        return "pages/categories";
    }

    @GetMapping("/new")
    public String newForm(Model model) {
        model.addAttribute("categoryTypes", CategoryType.values());
        model.addAttribute("isEdit", false);
        return "fragments/category-form :: form";
    }

    @GetMapping("/inline-form")
    public String inlineForm(@RequestParam CategoryType type, Model model) {
        model.addAttribute("type", type);
        return "fragments/category-inline-form :: form";
    }

    @PostMapping
    public String create(
            @RequestParam String name,
            @RequestParam CategoryType type,
            Model model,
            HttpServletResponse response,
            HttpSession session
    ) {
        try {
            var command = new CreateCategoryCommand(name, type);
            categoryService.create(command);
            session.setAttribute("successMessage", "Categoria criada com sucesso");
            response.setHeader("HX-Redirect", "/categories");
            return null;
        } catch (InvalidCategoryException | DuplicateCategoryNameException e) {
            model.addAttribute("errorMessage", e.getMessage());
            model.addAttribute("categoryTypes", CategoryType.values());
            model.addAttribute("isEdit", false);
            model.addAttribute("formName", name);
            model.addAttribute("formType", type);
            return "fragments/category-form :: form";
        }
    }

    @PostMapping("/inline")
    public String createInline(
            @RequestParam String name,
            @RequestParam CategoryType type,
            Model model
    ) {
        try {
            var command = new CreateCategoryCommand(name, type);
            var category = categoryService.create(command);
            model.addAttribute("category", category);
            return "fragments/category-list-item :: item";
        } catch (InvalidCategoryException | DuplicateCategoryNameException e) {
            model.addAttribute("type", type);
            model.addAttribute("errorMessage", e.getMessage());
            model.addAttribute("formName", name);
            return "fragments/category-inline-form :: form";
        }
    }

    @GetMapping("/{id}/edit")
    public String editForm(@PathVariable long id, Model model, HttpServletResponse response) {
        try {
            var category = categoryService.findById(id);
            model.addAttribute("category", category);
            model.addAttribute("categoryTypes", CategoryType.values());
            model.addAttribute("isEdit", true);
            return "fragments/category-form :: form";
        } catch (CategoryNotFoundException e) {
            response.setHeader("HX-Redirect", "/categories");
            return null;
        }
    }

    @PostMapping("/{id}")
    public String update(
            @PathVariable long id,
            @RequestParam String name,
            @RequestParam CategoryType type,
            @RequestParam(defaultValue = "false") boolean active,
            Model model,
            HttpServletResponse response,
            HttpSession session
    ) {
        try {
            var command = new UpdateCategoryCommand(id, name, type, active);
            categoryService.update(command);
            session.setAttribute("successMessage", "Categoria atualizada com sucesso");
            response.setHeader("HX-Redirect", "/categories");
            return null;
        } catch (InvalidCategoryException | DuplicateCategoryNameException e) {
            model.addAttribute("errorMessage", e.getMessage());
            model.addAttribute("formName", name);
            model.addAttribute("formType", type);
            model.addAttribute("category", Map.of("id", id, "active", active));
            model.addAttribute("categoryTypes", CategoryType.values());
            model.addAttribute("isEdit", true);
            return "fragments/category-form :: form";
        } catch (CategoryNotFoundException e) {
            response.setHeader("HX-Redirect", "/categories");
            return null;
        }
    }

    @PostMapping("/{id}/deactivate")
    public String deactivate(@PathVariable long id, Model model) {
        try {
            categoryService.deactivate(id);
            var category = categoryService.findById(id);
            model.addAttribute("category", category);
            return "fragments/category-list-item :: item";
        } catch (CategoryNotFoundException e) {
            return "fragments/category-list-item :: empty";
        }
    }

    @PostMapping("/{id}/activate")
    public String activate(@PathVariable long id, Model model) {
        try {
            categoryService.activate(id);
            var category = categoryService.findById(id);
            model.addAttribute("category", category);
            return "fragments/category-list-item :: item";
        } catch (CategoryNotFoundException e) {
            return "fragments/category-list-item :: empty";
        }
    }
}
