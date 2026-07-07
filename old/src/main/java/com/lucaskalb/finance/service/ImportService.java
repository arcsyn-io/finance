package com.lucaskalb.finance.service;

import com.lucaskalb.finance.dto.ConfirmImportResult;
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
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ImportService {

    private static final DateTimeFormatter NUBANK_DATE_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final DateTimeFormatter NU_CONTA_DATE_FORMAT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final ImportRepository importRepository;
    private final EntryRepository entryRepository;
    private final WalletRepository walletRepository;
    private final CategoryRepository categoryRepository;
    private final ImportSuggestionService importSuggestionService;

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

        var rows = switch (command.source()) {
            case NUBANK_CSV -> parseNubankCsvFile(command.file());
            case NU_CONTA_CSV -> parseNuContaCsvFile(command.file());
        };

        if (rows.isEmpty()) {
            throw new InvalidImportException("Arquivo CSV não contém lançamentos válidos");
        }

        var requestId = importRepository.insertRequest(
                command.source(),
                command.walletId(),
                command.categoryId(),
                command.nature(),
                command.economicEvent()
        );

        for (var row : rows) {
            var suggestion = importSuggestionService.suggest(row.description(), row.direction(), command.walletId());
            var suggestedCategoryId = command.categoryId() == null ? suggestion.categoryId() : null;
            var suggestedNature = command.nature() == null ? suggestion.nature() : null;
            var suggestedEconomicEvent = command.economicEvent() == null ? suggestion.economicEvent() : null;

            if (suggestion.confidence() > 0) {
                log.info("Importacao: sugestao para '{}': categoryId={}, nature={}, economicEvent={}, confidence={}",
                        row.description(), suggestion.categoryId(), suggestion.nature(),
                        suggestion.economicEvent(), suggestion.confidence());
            }

            importRepository.insertRow(
                    requestId,
                    row.description(),
                    row.occurredAt(),
                    row.amount(),
                    row.direction(),
                    row.externalId(),
                    suggestedCategoryId,
                    suggestedNature,
                    suggestedEconomicEvent
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
    public List<ImportRequest> listPending() {
        return importRepository.listPending();
    }

    @Transactional(readOnly = true)
    public int countRows(long requestId) {
        return importRepository.countRowsByRequestId(requestId);
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
                command.nature(),
                command.economicEvent()
        );

        return importRepository.findRowById(command.id()).orElseThrow();
    }

    @Transactional
    public void deleteRowsBatch(long importRequestId, java.util.List<Long> rowIds) {
        var request = importRepository.findRequestById(importRequestId)
                .orElseThrow(() -> new ImportNotFoundException(importRequestId));

        if (request.getStatus() == ImportStatus.CONFIRMED) {
            throw new InvalidImportException("Importação já confirmada");
        }

        importRepository.deleteRows(importRequestId, rowIds);
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
            case "economicEvent" -> {
                EconomicEvent economicEvent = (value == null || value.isBlank()) ? null : EconomicEvent.valueOf(value);
                importRepository.updateRowEconomicEvent(rowId, economicEvent);
            }
            default -> throw new InvalidImportException("Campo desconhecido: " + field);
        }
    }

    @Transactional
    public void updateRowsBatch(long importRequestId, List<Long> rowIds, String walletId,
                                String categoryId, String nature, String economicEvent) {
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

            if (economicEvent != null && !economicEvent.isEmpty()) {
                importRepository.updateRowEconomicEvent(rowId, EconomicEvent.valueOf(economicEvent));
            } else if (economicEvent != null) {
                importRepository.updateRowEconomicEvent(rowId, null);
            }
        }
    }

    @Transactional
    public ConfirmImportResult confirm(long id) {
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
        int skipped = 0;
        var startDate = rows.stream()
                .map(row -> row.getOccurredAt().toLocalDate())
                .min(LocalDate::compareTo)
                .orElse(LocalDate.now());
        var endDate = rows.stream()
                .map(row -> row.getOccurredAt().toLocalDate())
                .max(LocalDate::compareTo)
                .orElse(startDate);

        for (var row : rows) {
            var categoryId = row.getCategoryId() != null ? row.getCategoryId() : request.getCategoryId();
            var walletId = row.getWalletId() != null ? row.getWalletId() : request.getWalletId();
            var nature = row.getNature() != null ? row.getNature() : request.getNature();
            var explicitEvent = row.getEconomicEvent() != null ? row.getEconomicEvent() : request.getEconomicEvent();

            // Verifica duplicata por external_id
            if (row.getExternalId() != null && entryRepository.existsByExternalIdAndWallet(row.getExternalId(), walletId)) {
                log.info("Importacao {}: linha '{}' ignorada por duplicidade externalId={} walletId={}",
                        id, row.getDescription(), row.getExternalId(), walletId);
                skipped++;
                continue;
            }

            var wallet = walletRepository.findById(walletId)
                    .orElseThrow(() -> new WalletNotFoundException(walletId));

            var category = categoryRepository.findById(categoryId)
                    .orElseThrow(CategoryNotFoundException::new);

            var direction = inferDirection(row.getDirection(), category.getType());
            var economicEvent = explicitEvent != null
                    ? explicitEvent
                    : EntryService.inferEconomicEvent(wallet.getType(), nature, direction, null);

            entryRepository.insert(
                    walletId,
                    categoryId,
                    nature,
                    direction,
                    row.getAmount(),
                    row.getOccurredAt(),
                    row.getDescription(),
                    row.getExternalId(),
                    economicEvent
            );
            count++;
        }

        importRepository.confirmRequest(id);

        log.info("Importacao {} confirmada: importados={}, ignoradosPorDuplicidade={}, periodo={}..{}",
                id, count, skipped, startDate, endDate);

        return new ConfirmImportResult(count, skipped, startDate, endDate);
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

    private List<CsvRow> parseNubankCsvFile(MultipartFile file) {
        var rows = new ArrayList<CsvRow>();
        int lineNumber = 0;
        int skipped = 0;

        try (var reader = new BufferedReader(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {
            String line;
            boolean isHeader = true;

            while ((line = reader.readLine()) != null) {
                lineNumber++;
                if (isHeader) {
                    log.debug("Importacao Nubank cartao: cabecalho CSV linha {}: {}", lineNumber, line);
                    isHeader = false;
                    continue;
                }

                if (line.isBlank()) {
                    continue;
                }

                var row = parseNubankCsvLine(line, lineNumber);
                if (row != null) {
                    rows.add(row);
                } else {
                    skipped++;
                }
            }
        } catch (IOException e) {
            throw new InvalidImportException("Erro ao ler arquivo CSV: " + e.getMessage());
        }

        log.info("Importacao Nubank cartao: arquivo={}, linhasLidas={}, linhasValidas={}, linhasIgnoradas={}",
                file.getOriginalFilename(), Math.max(lineNumber - 1, 0), rows.size(), skipped);

        return rows;
    }

    private CsvRow parseNubankCsvLine(String line, int lineNumber) {
        // Formato: date,title,amount
        // Exemplo: 2025-12-29,Cooper Filial Jaragua,613.02
        // Com aspas: 2025-12-24,"IOF de ""Openai *Chatgpt Subscr""",4.05
        var parts = parseCsvFields(line);

        if (parts.size() >= 4 && looksLikeNuContaRow(parts)) {
            log.info("Importacao Nubank cartao: linha {} detectada no formato NuConta/debito", lineNumber);
            return parseNuContaCsvParts(parts, lineNumber, line);
        }

        if (parts.size() < 3) {
            log.warn("Importacao Nubank cartao: linha {} ignorada, esperado 3 campos e recebido {}. Conteudo: {}",
                    lineNumber, parts.size(), line);
            return null;
        }

        try {
            var dateStr = parts.get(0).trim();
            var description = parts.get(1).trim();
            var valueStr = parts.get(2).trim();

            var date = LocalDate.parse(dateStr, NUBANK_DATE_FORMAT);
            var occurredAt = date.atStartOfDay();

            var value = parseMoney(valueStr);
            // Nubank: valor positivo = despesa (OUT), negativo = estorno/entrada (IN)
            var direction = value.signum() >= 0 ? EntryDirection.OUT : EntryDirection.IN;
            var amount = toCents(value);

            if (amount <= 0) {
                log.warn("Importacao Nubank cartao: linha {} ignorada, valor zerado apos conversao. Valor original: {}",
                        lineNumber, valueStr);
                return null;
            }

            return new CsvRow(description, occurredAt, amount, direction, null);

        } catch (DateTimeParseException | NumberFormatException | ArithmeticException e) {
            log.warn("Importacao Nubank cartao: linha {} ignorada por erro de parse. Campos: {}. Erro: {}",
                    lineNumber, parts, e.getMessage());
            return null;
        }
    }

    private List<CsvRow> parseNuContaCsvFile(MultipartFile file) {
        var rows = new ArrayList<CsvRow>();
        int lineNumber = 0;
        int skipped = 0;

        try (var reader = new BufferedReader(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {
            String line;
            boolean isHeader = true;

            while ((line = reader.readLine()) != null) {
                lineNumber++;
                if (isHeader) {
                    log.debug("Importacao NuConta: cabecalho CSV linha {}: {}", lineNumber, line);
                    isHeader = false;
                    continue;
                }

                if (line.isBlank()) {
                    continue;
                }

                var row = parseNuContaCsvLine(line, lineNumber);
                if (row != null) {
                    rows.add(row);
                } else {
                    skipped++;
                }
            }
        } catch (IOException e) {
            throw new InvalidImportException("Erro ao ler arquivo CSV: " + e.getMessage());
        }

        log.info("Importacao NuConta: arquivo={}, linhasLidas={}, linhasValidas={}, linhasIgnoradas={}",
                file.getOriginalFilename(), Math.max(lineNumber - 1, 0), rows.size(), skipped);

        return rows;
    }

    private CsvRow parseNuContaCsvLine(String line, int lineNumber) {
        // Formato: Data,Valor,Identificador,Descrição
        // Exemplo: 03/01/2026,-1512.50,6958faac-4d0e-40fc-b1d4-a0a030e4eb70,Transferência enviada pelo Pix
        var parts = parseCsvFields(line);

        return parseNuContaCsvParts(parts, lineNumber, line);
    }

    private CsvRow parseNuContaCsvParts(List<String> parts, int lineNumber, String line) {
        if (parts.size() < 4) {
            log.warn("Importacao NuConta: linha {} ignorada, esperado 4 campos e recebido {}. Conteudo: {}",
                    lineNumber, parts.size(), line);
            return null;
        }

        try {
            var dateStr = parts.get(0).trim();
            var valueStr = parts.get(1).trim().replace(",", ".");
            var externalId = parts.get(2).trim();
            var description = parts.get(3).trim();

            var date = LocalDate.parse(dateStr, NU_CONTA_DATE_FORMAT);
            var occurredAt = date.atStartOfDay();

            var value = parseMoney(valueStr);
            // Nu Conta: valor positivo = entrada (IN), negativo = saída (OUT)
            var direction = value.signum() >= 0 ? EntryDirection.IN : EntryDirection.OUT;
            var amount = toCents(value);

            if (amount <= 0) {
                log.warn("Importacao NuConta: linha {} ignorada, valor zerado apos conversao. Valor original: {}",
                        lineNumber, valueStr);
                return null;
            }

            return new CsvRow(description, occurredAt, amount, direction, externalId);

        } catch (DateTimeParseException | NumberFormatException | ArithmeticException e) {
            log.warn("Importacao NuConta: linha {} ignorada por erro de parse. Campos: {}. Erro: {}",
                    lineNumber, parts, e.getMessage());
            return null;
        }
    }

    private boolean looksLikeNuContaRow(List<String> parts) {
        try {
            LocalDate.parse(parts.get(0).trim(), NU_CONTA_DATE_FORMAT);
            parseMoney(parts.get(1).trim());
            return true;
        } catch (DateTimeParseException | NumberFormatException e) {
            return false;
        }
    }

    private BigDecimal parseMoney(String value) {
        var normalized = value.trim()
                .replace(",", ".")
                .replaceAll("\\s+", "");
        return new BigDecimal(normalized);
    }

    private long toCents(BigDecimal value) {
        return value.abs()
                .movePointRight(2)
                .setScale(0, RoundingMode.HALF_UP)
                .longValueExact();
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

    private record CsvRow(String description, LocalDateTime occurredAt, long amount, EntryDirection direction, String externalId) {}
}
