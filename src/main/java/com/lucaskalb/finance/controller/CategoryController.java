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

import java.util.Map;

@Controller
@RequestMapping("/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    @GetMapping
    public String list(
            @RequestParam(name = "showInactive", defaultValue = "false") boolean showInactive,
            @RequestParam(name = "success", required = false) String success,
            Model model
    ) {
        var categories = showInactive
                ? categoryService.listAll()
                : categoryService.listActive();

        model.addAttribute("title", "Categorias - Finance");
        model.addAttribute("categories", categories);
        model.addAttribute("showInactive", showInactive);
        model.addAttribute("categoryTypes", CategoryType.values());

        if ("created".equals(success)) {
            model.addAttribute("successMessage", "Categoria criada com sucesso");
        } else if ("updated".equals(success)) {
            model.addAttribute("successMessage", "Categoria atualizada com sucesso");
        }

        return "pages/categories";
    }

    @GetMapping("/new")
    public String newForm(Model model) {
        model.addAttribute("categoryTypes", CategoryType.values());
        model.addAttribute("isEdit", false);
        return "fragments/category-form :: form";
    }

    @PostMapping
    public String create(
            @RequestParam String name,
            @RequestParam CategoryType type,
            Model model,
            HttpServletResponse response
    ) {
        try {
            var command = new CreateCategoryCommand(name, type);
            categoryService.create(command);
            response.setHeader("HX-Redirect", "/categories?success=created");
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
            HttpServletResponse response
    ) {
        try {
            var command = new UpdateCategoryCommand(id, name, type, active);
            categoryService.update(command);
            response.setHeader("HX-Redirect", "/categories?success=updated");
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
            return "fragments/category-row :: row";
        } catch (CategoryNotFoundException e) {
            return "fragments/category-row :: empty";
        }
    }

    @PostMapping("/{id}/activate")
    public String activate(@PathVariable long id, Model model) {
        try {
            categoryService.activate(id);
            var category = categoryService.findById(id);
            model.addAttribute("category", category);
            return "fragments/category-row :: row";
        } catch (CategoryNotFoundException e) {
            return "fragments/category-row :: empty";
        }
    }
}
