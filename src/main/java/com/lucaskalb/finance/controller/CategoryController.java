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
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
@RequestMapping("/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    @GetMapping
    public String list(
            @RequestParam(name = "showInactive", defaultValue = "false") boolean showInactive,
            Model model
    ) {
        var categories = showInactive
                ? categoryService.listAll()
                : categoryService.listActive();

        model.addAttribute("title", "Categorias - Finance");
        model.addAttribute("categories", categories);
        model.addAttribute("showInactive", showInactive);
        model.addAttribute("categoryTypes", CategoryType.values());
        return "pages/categories";
    }

    @GetMapping("/new")
    public String newForm(Model model) {
        model.addAttribute("title", "Nova Categoria - Finance");
        model.addAttribute("categoryTypes", CategoryType.values());
        model.addAttribute("isEdit", false);
        return "pages/category-form";
    }

    @PostMapping
    public String create(
            @RequestParam String name,
            @RequestParam CategoryType type,
            RedirectAttributes redirectAttributes
    ) {
        try {
            var command = new CreateCategoryCommand(name, type);
            categoryService.create(command);
            redirectAttributes.addFlashAttribute("successMessage", "Categoria criada com sucesso");
            return "redirect:/categories";
        } catch (InvalidCategoryException | DuplicateCategoryNameException e) {
            redirectAttributes.addFlashAttribute("errorMessage", e.getMessage());
            return "redirect:/categories/new";
        }
    }

    @GetMapping("/{id}")
    public String editForm(@PathVariable long id, Model model, RedirectAttributes redirectAttributes) {
        try {
            var category = categoryService.findById(id);
            model.addAttribute("title", "Editar Categoria - Finance");
            model.addAttribute("category", category);
            model.addAttribute("categoryTypes", CategoryType.values());
            model.addAttribute("isEdit", true);
            return "pages/category-form";
        } catch (CategoryNotFoundException e) {
            redirectAttributes.addFlashAttribute("errorMessage", e.getMessage());
            return "redirect:/categories";
        }
    }

    @PostMapping("/{id}")
    public String update(
            @PathVariable long id,
            @RequestParam String name,
            @RequestParam CategoryType type,
            @RequestParam(defaultValue = "false") boolean active,
            RedirectAttributes redirectAttributes
    ) {
        try {
            var command = new UpdateCategoryCommand(id, name, type, active);
            categoryService.update(command);
            redirectAttributes.addFlashAttribute("successMessage", "Categoria atualizada com sucesso");
            return "redirect:/categories";
        } catch (CategoryNotFoundException e) {
            redirectAttributes.addFlashAttribute("errorMessage", e.getMessage());
            return "redirect:/categories";
        } catch (InvalidCategoryException | DuplicateCategoryNameException e) {
            redirectAttributes.addFlashAttribute("errorMessage", e.getMessage());
            return "redirect:/categories/" + id;
        }
    }

    @PostMapping("/{id}/deactivate")
    public String deactivate(@PathVariable long id, RedirectAttributes redirectAttributes) {
        try {
            categoryService.deactivate(id);
            redirectAttributes.addFlashAttribute("successMessage", "Categoria desativada com sucesso");
        } catch (CategoryNotFoundException e) {
            redirectAttributes.addFlashAttribute("errorMessage", e.getMessage());
        }
        return "redirect:/categories";
    }

    @PostMapping("/{id}/activate")
    public String activate(@PathVariable long id, RedirectAttributes redirectAttributes) {
        try {
            categoryService.activate(id);
            redirectAttributes.addFlashAttribute("successMessage", "Categoria ativada com sucesso");
        } catch (CategoryNotFoundException e) {
            redirectAttributes.addFlashAttribute("errorMessage", e.getMessage());
        }
        return "redirect:/categories";
    }

    @PostMapping("/{id}/deactivate-htmx")
    public String deactivateHtmx(@PathVariable long id, Model model) {
        try {
            categoryService.deactivate(id);
            var category = categoryService.findById(id);
            model.addAttribute("category", category);
            return "fragments/category-row :: row";
        } catch (CategoryNotFoundException e) {
            return "fragments/category-row :: empty";
        }
    }

    @PostMapping("/{id}/activate-htmx")
    public String activateHtmx(@PathVariable long id, Model model) {
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
