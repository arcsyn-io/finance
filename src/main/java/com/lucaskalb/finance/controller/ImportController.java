package com.lucaskalb.finance.controller;

import com.lucaskalb.finance.dto.CreateImportCommand;
import com.lucaskalb.finance.dto.UpdateImportRowCommand;
import com.lucaskalb.finance.exception.CategoryNotFoundException;
import com.lucaskalb.finance.exception.ImportNotFoundException;
import com.lucaskalb.finance.exception.InvalidImportException;
import com.lucaskalb.finance.exception.WalletNotFoundException;
import com.lucaskalb.finance.model.EntryNature;
import com.lucaskalb.finance.model.ImportSource;
import com.lucaskalb.finance.service.CategoryService;
import com.lucaskalb.finance.service.ImportService;
import com.lucaskalb.finance.service.WalletService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.time.LocalDate;

@Controller
@RequestMapping("/imports")
@RequiredArgsConstructor
public class ImportController {

    private final ImportService importService;
    private final WalletService walletService;
    private final CategoryService categoryService;

    @GetMapping("/new")
    public String newForm(Model model) {
        model.addAttribute("title", "Importar Lançamentos - Finance");
        model.addAttribute("wallets", walletService.listActive());
        model.addAttribute("categories", categoryService.listActive());
        model.addAttribute("natures", EntryNature.values());
        model.addAttribute("sources", ImportSource.values());
        return "pages/import-upload";
    }

    @PostMapping
    public String create(
            @RequestParam("file") MultipartFile file,
            @RequestParam ImportSource source,
            @RequestParam(required = false) Long walletId,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) EntryNature nature,
            Model model,
            HttpServletResponse response
    ) {
        try {
            var command = new CreateImportCommand(file, source, walletId, categoryId, nature);
            var importRequest = importService.createFromCsv(command);

            response.setHeader("HX-Redirect", "/imports/" + importRequest.getId() + "/review");
            return null;

        } catch (InvalidImportException | WalletNotFoundException | CategoryNotFoundException e) {
            model.addAttribute("errorMessage", e.getMessage());
            model.addAttribute("wallets", walletService.listActive());
            model.addAttribute("categories", categoryService.listActive());
            model.addAttribute("natures", EntryNature.values());
            model.addAttribute("sources", ImportSource.values());
            model.addAttribute("formSource", source);
            model.addAttribute("formWalletId", walletId);
            model.addAttribute("formCategoryId", categoryId);
            model.addAttribute("formNature", nature);
            return "pages/import-upload";
        }
    }

    @GetMapping("/{id}/review")
    public String review(@PathVariable long id, Model model, HttpServletResponse response) {
        try {
            var importRequest = importService.findById(id);

            model.addAttribute("title", "Revisar Importação - Finance");
            model.addAttribute("importRequest", importRequest);
            model.addAttribute("wallets", walletService.listActive());
            model.addAttribute("categories", categoryService.listActive());
            model.addAttribute("natures", EntryNature.values());
            return "pages/import-review";

        } catch (ImportNotFoundException e) {
            response.setHeader("HX-Redirect", "/entries");
            return null;
        }
    }

    @GetMapping("/{id}/rows/{rowId}/edit")
    public String editRowForm(
            @PathVariable long id,
            @PathVariable long rowId,
            Model model,
            HttpServletResponse response
    ) {
        try {
            var importRequest = importService.findById(id);
            var row = importService.findRowById(rowId);

            model.addAttribute("importRequest", importRequest);
            model.addAttribute("row", row);
            model.addAttribute("rowAmount", formatCentsToAmount(row.getAmount()));
            model.addAttribute("wallets", walletService.listActive());
            model.addAttribute("categories", categoryService.listActive());
            model.addAttribute("natures", EntryNature.values());
            return "fragments/import-row :: editForm";

        } catch (ImportNotFoundException | InvalidImportException e) {
            response.setStatus(404);
            return null;
        }
    }

    @PostMapping("/{id}/rows/{rowId}")
    public String updateRow(
            @PathVariable long id,
            @PathVariable long rowId,
            @RequestParam String description,
            @RequestParam LocalDate occurredAt,
            @RequestParam String amount,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Long walletId,
            @RequestParam(required = false) EntryNature nature,
            Model model,
            HttpServletResponse response
    ) {
        try {
            var amountCents = parseAmountToCents(amount);
            var command = new UpdateImportRowCommand(
                    rowId,
                    id,
                    description,
                    occurredAt.atStartOfDay(),
                    amountCents,
                    categoryId,
                    walletId,
                    nature
            );

            var row = importService.updateRow(command);
            var importRequest = importService.findById(id);

            model.addAttribute("row", row);
            model.addAttribute("importRequest", importRequest);
            return "fragments/import-row :: row";

        } catch (InvalidImportException | CategoryNotFoundException | WalletNotFoundException e) {
            var row = importService.findRowById(rowId);
            var importRequest = importService.findById(id);

            model.addAttribute("errorMessage", e.getMessage());
            model.addAttribute("row", row);
            model.addAttribute("importRequest", importRequest);
            model.addAttribute("rowAmount", amount);
            model.addAttribute("wallets", walletService.listActive());
            model.addAttribute("categories", categoryService.listActive());
            model.addAttribute("natures", EntryNature.values());
            return "fragments/import-row :: editForm";
        }
    }

    @DeleteMapping("/{id}/rows/{rowId}")
    public String deleteRow(
            @PathVariable long id,
            @PathVariable long rowId,
            HttpServletResponse response
    ) {
        try {
            importService.deleteRow(id, rowId);
            return "fragments/import-row :: empty";

        } catch (ImportNotFoundException | InvalidImportException e) {
            response.setStatus(400);
            return null;
        }
    }

    @PostMapping("/{id}/rows/{rowId}/field")
    @ResponseBody
    public void updateRowField(
            @PathVariable long id,
            @PathVariable long rowId,
            @RequestParam String field,
            @RequestParam(required = false) String value,
            HttpServletResponse response
    ) {
        try {
            importService.updateRowField(id, rowId, field, value);
            response.setStatus(200);
        } catch (Exception e) {
            response.setStatus(400);
        }
    }

    @PostMapping("/{id}/rows/batch")
    @ResponseBody
    public void updateRowsBatch(
            @PathVariable long id,
            @RequestBody BatchUpdateRequest request,
            HttpServletResponse response
    ) {
        try {
            importService.updateRowsBatch(id, request.rowIds(), request.walletId(), request.categoryId(), request.nature());
            response.setStatus(200);
        } catch (Exception e) {
            response.setStatus(400);
        }
    }

    public record BatchUpdateRequest(
            java.util.List<Long> rowIds,
            String walletId,
            String categoryId,
            String nature
    ) {}

    @PostMapping("/{id}/confirm")
    public String confirm(
            @PathVariable long id,
            HttpServletResponse response,
            HttpSession session
    ) {
        try {
            var count = importService.confirm(id);
            session.setAttribute("successMessage", count + " lançamento(s) importado(s) com sucesso");
            response.setHeader("HX-Redirect", "/entries");
            return null;

        } catch (ImportNotFoundException | InvalidImportException | CategoryNotFoundException e) {
            session.setAttribute("errorMessage", e.getMessage());
            response.setHeader("HX-Redirect", "/imports/" + id + "/review");
            return null;
        }
    }

    @DeleteMapping("/{id}")
    public String cancel(
            @PathVariable long id,
            HttpServletResponse response,
            HttpSession session
    ) {
        try {
            importService.cancel(id);
            session.setAttribute("successMessage", "Importação cancelada");
            response.setHeader("HX-Redirect", "/entries");
            return null;

        } catch (ImportNotFoundException | InvalidImportException e) {
            session.setAttribute("errorMessage", e.getMessage());
            response.setHeader("HX-Redirect", "/entries");
            return null;
        }
    }

    private long parseAmountToCents(String amount) {
        if (amount == null || amount.isBlank()) {
            throw new InvalidImportException("Valor é obrigatório");
        }
        try {
            var normalized = amount.replace(",", ".").trim();
            var value = Double.parseDouble(normalized);
            return Math.round(value * 100);
        } catch (NumberFormatException e) {
            throw new InvalidImportException("Valor inválido: " + amount);
        }
    }

    private String formatCentsToAmount(long cents) {
        return String.format("%.2f", cents / 100.0).replace(".", ",");
    }
}
