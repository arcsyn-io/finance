package com.lucaskalb.finance.service;

import com.lucaskalb.finance.dto.CreateImportCommand;
import com.lucaskalb.finance.dto.UpdateImportRowCommand;
import com.lucaskalb.finance.exception.CategoryNotFoundException;
import com.lucaskalb.finance.exception.ImportNotFoundException;
import com.lucaskalb.finance.exception.InvalidImportException;
import com.lucaskalb.finance.exception.WalletNotFoundException;
import com.lucaskalb.finance.model.*;
import com.lucaskalb.finance.repository.CategoryRepository;
import com.lucaskalb.finance.repository.EntryRepository;
import com.lucaskalb.finance.repository.ImportRepository;
import com.lucaskalb.finance.repository.WalletRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ImportService {

    private static final DateTimeFormatter NUBANK_DATE_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    private final ImportRepository importRepository;
    private final EntryRepository entryRepository;
    private final WalletRepository walletRepository;
    private final CategoryRepository categoryRepository;

    @Transactional
    public ImportRequest createFromCsv(CreateImportCommand command) {
        validateCommand(command);

        if (command.walletId() != null) {
            var wallet = walletRepository.findById(command.walletId())
                    .orElseThrow(() -> new WalletNotFoundException(command.walletId()));

            if (!wallet.isActive()) {
                throw new InvalidImportException("Carteira inativa não pode receber importações");
            }
        }

        if (command.categoryId() != null) {
            categoryRepository.findById(command.categoryId())
                    .orElseThrow(CategoryNotFoundException::new);
        }

        var rows = parseCsvFile(command.file());

        if (rows.isEmpty()) {
            throw new InvalidImportException("Arquivo CSV não contém lançamentos válidos");
        }

        var requestId = importRepository.insertRequest(
                command.source(),
                command.walletId(),
                command.categoryId(),
                command.nature()
        );

        for (var row : rows) {
            importRepository.insertRow(
                    requestId,
                    row.description(),
                    row.occurredAt(),
                    row.amount(),
                    row.direction()
            );
        }

        return findById(requestId);
    }

    @Transactional(readOnly = true)
    public ImportRequest findById(long id) {
        var request = importRepository.findRequestById(id)
                .orElseThrow(() -> new ImportNotFoundException(id));

        var rows = importRepository.findRowsByRequestId(id);
        request.setRows(rows);

        return request;
    }

    @Transactional(readOnly = true)
    public ImportRow findRowById(long id) {
        return importRepository.findRowById(id)
                .orElseThrow(() -> new InvalidImportException("Linha não encontrada: " + id));
    }

    @Transactional
    public ImportRow updateRow(UpdateImportRowCommand command) {
        var row = importRepository.findRowById(command.id())
                .orElseThrow(() -> new InvalidImportException("Linha não encontrada: " + command.id()));

        if (row.getImportRequestId() != command.importRequestId()) {
            throw new InvalidImportException("Linha não pertence a esta importação");
        }

        var request = importRepository.findRequestById(command.importRequestId())
                .orElseThrow(() -> new ImportNotFoundException(command.importRequestId()));

        if (request.getStatus() == ImportStatus.CONFIRMED) {
            throw new InvalidImportException("Importação já confirmada");
        }

        if (command.amount() <= 0) {
            throw new InvalidImportException("Valor deve ser maior que zero");
        }

        if (command.categoryId() != null) {
            categoryRepository.findById(command.categoryId())
                    .orElseThrow(CategoryNotFoundException::new);
        }

        if (command.walletId() != null) {
            walletRepository.findById(command.walletId())
                    .orElseThrow(() -> new WalletNotFoundException(command.walletId()));
        }

        importRepository.updateRow(
                command.id(),
                command.description(),
                command.occurredAt(),
                command.amount(),
                command.categoryId(),
                command.walletId(),
                command.nature()
        );

        return importRepository.findRowById(command.id()).orElseThrow();
    }

    @Transactional
    public void deleteRow(long importRequestId, long rowId) {
        var request = importRepository.findRequestById(importRequestId)
                .orElseThrow(() -> new ImportNotFoundException(importRequestId));

        if (request.getStatus() == ImportStatus.CONFIRMED) {
            throw new InvalidImportException("Importação já confirmada");
        }

        var row = importRepository.findRowById(rowId)
                .orElseThrow(() -> new InvalidImportException("Linha não encontrada: " + rowId));

        if (row.getImportRequestId() != importRequestId) {
            throw new InvalidImportException("Linha não pertence a esta importação");
        }

        importRepository.deleteRow(rowId);
    }

    @Transactional
    public void updateRowField(long importRequestId, long rowId, String field, String value) {
        var request = importRepository.findRequestById(importRequestId)
                .orElseThrow(() -> new ImportNotFoundException(importRequestId));

        if (request.getStatus() == ImportStatus.CONFIRMED) {
            throw new InvalidImportException("Importação já confirmada");
        }

        var row = importRepository.findRowById(rowId)
                .orElseThrow(() -> new InvalidImportException("Linha não encontrada: " + rowId));

        if (row.getImportRequestId() != importRequestId) {
            throw new InvalidImportException("Linha não pertence a esta importação");
        }

        switch (field) {
            case "description" -> importRepository.updateRowDescription(rowId, value);
            case "walletId" -> {
                Long walletId = (value == null || value.isBlank()) ? null : Long.parseLong(value);
                importRepository.updateRowWallet(rowId, walletId);
            }
            case "categoryId" -> {
                Long categoryId = (value == null || value.isBlank()) ? null : Long.parseLong(value);
                importRepository.updateRowCategory(rowId, categoryId);
            }
            case "nature" -> {
                EntryNature nature = (value == null || value.isBlank()) ? null : EntryNature.valueOf(value);
                importRepository.updateRowNature(rowId, nature);
            }
            default -> throw new InvalidImportException("Campo desconhecido: " + field);
        }
    }

    @Transactional
    public void updateRowsBatch(long importRequestId, List<Long> rowIds, String walletId, String categoryId, String nature) {
        var request = importRepository.findRequestById(importRequestId)
                .orElseThrow(() -> new ImportNotFoundException(importRequestId));

        if (request.getStatus() == ImportStatus.CONFIRMED) {
            throw new InvalidImportException("Importação já confirmada");
        }

        for (var rowId : rowIds) {
            var row = importRepository.findRowById(rowId)
                    .orElseThrow(() -> new InvalidImportException("Linha não encontrada: " + rowId));

            if (row.getImportRequestId() != importRequestId) {
                throw new InvalidImportException("Linha não pertence a esta importação");
            }

            if (walletId != null && !walletId.isEmpty()) {
                importRepository.updateRowWallet(rowId, Long.parseLong(walletId));
            } else if (walletId != null) {
                importRepository.updateRowWallet(rowId, null);
            }

            if (categoryId != null && !categoryId.isEmpty()) {
                importRepository.updateRowCategory(rowId, Long.parseLong(categoryId));
            } else if (categoryId != null) {
                importRepository.updateRowCategory(rowId, null);
            }

            if (nature != null && !nature.isEmpty()) {
                importRepository.updateRowNature(rowId, EntryNature.valueOf(nature));
            } else if (nature != null) {
                importRepository.updateRowNature(rowId, null);
            }
        }
    }

    @Transactional
    public int confirm(long id) {
        var request = importRepository.findRequestById(id)
                .orElseThrow(() -> new ImportNotFoundException(id));

        if (request.getStatus() == ImportStatus.CONFIRMED) {
            throw new InvalidImportException("Importação já confirmada");
        }

        var rows = importRepository.findRowsByRequestId(id);

        if (rows.isEmpty()) {
            throw new InvalidImportException("Importação não possui lançamentos");
        }

        // Validar que todos os campos obrigatórios estão preenchidos
        for (var row : rows) {
            var walletId = row.getWalletId() != null ? row.getWalletId() : request.getWalletId();
            var categoryId = row.getCategoryId() != null ? row.getCategoryId() : request.getCategoryId();
            var nature = row.getNature() != null ? row.getNature() : request.getNature();

            if (walletId == null) {
                throw new InvalidImportException("Carteira é obrigatória para o lançamento: " + row.getDescription());
            }
            if (categoryId == null) {
                throw new InvalidImportException("Categoria é obrigatória para o lançamento: " + row.getDescription());
            }
            if (nature == null) {
                throw new InvalidImportException("Natureza é obrigatória para o lançamento: " + row.getDescription());
            }
        }

        int count = 0;
        for (var row : rows) {
            var categoryId = row.getCategoryId() != null ? row.getCategoryId() : request.getCategoryId();
            var walletId = row.getWalletId() != null ? row.getWalletId() : request.getWalletId();
            var nature = row.getNature() != null ? row.getNature() : request.getNature();

            var category = categoryRepository.findById(categoryId)
                    .orElseThrow(CategoryNotFoundException::new);

            var direction = inferDirection(row.getDirection(), category.getType());

            entryRepository.insert(
                    walletId,
                    categoryId,
                    nature,
                    direction,
                    row.getAmount(),
                    row.getOccurredAt(),
                    row.getDescription()
            );
            count++;
        }

        importRepository.confirmRequest(id);

        return count;
    }

    @Transactional
    public void cancel(long id) {
        var request = importRepository.findRequestById(id)
                .orElseThrow(() -> new ImportNotFoundException(id));

        if (request.getStatus() == ImportStatus.CONFIRMED) {
            throw new InvalidImportException("Não é possível cancelar importação já confirmada");
        }

        importRepository.deleteRequest(id);
    }

    private void validateCommand(CreateImportCommand command) {
        if (command.file() == null || command.file().isEmpty()) {
            throw new InvalidImportException("Arquivo é obrigatório");
        }

        if (command.source() == null) {
            throw new InvalidImportException("Fonte da importação é obrigatória");
        }
    }

    private List<CsvRow> parseCsvFile(MultipartFile file) {
        var rows = new ArrayList<CsvRow>();

        try (var reader = new BufferedReader(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {
            String line;
            boolean isHeader = true;

            while ((line = reader.readLine()) != null) {
                if (isHeader) {
                    isHeader = false;
                    continue;
                }

                if (line.isBlank()) {
                    continue;
                }

                var row = parseCsvLine(line);
                if (row != null) {
                    rows.add(row);
                }
            }
        } catch (IOException e) {
            throw new InvalidImportException("Erro ao ler arquivo CSV: " + e.getMessage());
        }

        return rows;
    }

    private CsvRow parseCsvLine(String line) {
        // Formato: date,title,amount
        // Exemplo: 2025-12-29,Cooper Filial Jaragua,613.02
        // Com aspas: 2025-12-24,"IOF de ""Openai *Chatgpt Subscr""",4.05
        var parts = parseCsvFields(line);

        if (parts.size() < 3) {
            return null;
        }

        try {
            var dateStr = parts.get(0).trim();
            var description = parts.get(1).trim();
            var valueStr = parts.get(2).trim();

            var date = LocalDate.parse(dateStr, NUBANK_DATE_FORMAT);
            var occurredAt = date.atStartOfDay();

            var value = Double.parseDouble(valueStr);
            // Nubank: valor positivo = despesa (OUT), negativo = estorno/entrada (IN)
            var direction = value >= 0 ? EntryDirection.OUT : EntryDirection.IN;
            var amount = Math.round(Math.abs(value) * 100);

            if (amount <= 0) {
                return null;
            }

            return new CsvRow(description, occurredAt, amount, direction);

        } catch (DateTimeParseException | NumberFormatException e) {
            return null;
        }
    }

    private List<String> parseCsvFields(String line) {
        var fields = new ArrayList<String>();
        var current = new StringBuilder();
        boolean inQuotes = false;

        for (int i = 0; i < line.length(); i++) {
            char c = line.charAt(i);

            if (inQuotes) {
                if (c == '"') {
                    if (i + 1 < line.length() && line.charAt(i + 1) == '"') {
                        current.append('"');
                        i++;
                    } else {
                        inQuotes = false;
                    }
                } else {
                    current.append(c);
                }
            } else {
                if (c == '"') {
                    inQuotes = true;
                } else if (c == ',') {
                    fields.add(current.toString());
                    current = new StringBuilder();
                } else {
                    current.append(c);
                }
            }
        }
        fields.add(current.toString());

        return fields;
    }

    private EntryDirection inferDirection(EntryDirection csvDirection, CategoryType categoryType) {
        return categoryType == CategoryType.INCOME ? EntryDirection.IN : EntryDirection.OUT;
    }

    private record CsvRow(String description, LocalDateTime occurredAt, long amount, EntryDirection direction) {}
}
