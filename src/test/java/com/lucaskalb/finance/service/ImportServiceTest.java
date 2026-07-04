package com.lucaskalb.finance.service;

import com.lucaskalb.finance.dto.CreateImportCommand;
import com.lucaskalb.finance.dto.ImportSuggestion;
import com.lucaskalb.finance.model.EconomicEvent;
import com.lucaskalb.finance.model.EntryDirection;
import com.lucaskalb.finance.model.EntryNature;
import com.lucaskalb.finance.model.ImportRequest;
import com.lucaskalb.finance.model.ImportSource;
import com.lucaskalb.finance.model.ImportStatus;
import com.lucaskalb.finance.repository.CategoryRepository;
import com.lucaskalb.finance.repository.EntryRepository;
import com.lucaskalb.finance.repository.ImportRepository;
import com.lucaskalb.finance.repository.WalletRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ImportServiceTest {

    @Mock
    private ImportRepository importRepository;

    @Mock
    private EntryRepository entryRepository;

    @Mock
    private WalletRepository walletRepository;

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private ImportSuggestionService importSuggestionService;

    @InjectMocks
    private ImportService importService;

    @Test
    @DisplayName("deve importar CSV de cartao Nubank com valor em decimal brasileiro")
    void shouldImportNubankCardCsvWithBrazilianDecimalAmount() {
        var csv = """
                date,title,amount
                2026-03-29,Subzero,"9,00"
                2026-03-28,Shell Box - NuPay,"332,26"
                """;
        var file = new MockMultipartFile(
                "file",
                "Nubank_2026-04-07.csv",
                "text/csv",
                csv.getBytes(StandardCharsets.UTF_8)
        );
        var command = new CreateImportCommand(file, ImportSource.NUBANK_CSV, null, null, null, null);
        var request = ImportRequest.builder()
                .id(42L)
                .status(ImportStatus.PENDING_REVIEW)
                .source(ImportSource.NUBANK_CSV)
                .build();

        when(importRepository.insertRequest(ImportSource.NUBANK_CSV, null, null, null, null)).thenReturn(42L);
        when(importRepository.findRequestById(42L)).thenReturn(Optional.of(request));
        when(importRepository.findRowsByRequestId(42L)).thenReturn(List.of());
        when(importSuggestionService.suggest(any(), any(), isNull())).thenReturn(ImportSuggestion.empty());

        importService.createFromCsv(command);

        verify(importRepository).insertRow(
                eq(42L),
                eq("Subzero"),
                eq(LocalDate.of(2026, 3, 29).atStartOfDay()),
                eq(900L),
                eq(EntryDirection.OUT),
                isNull(),
                isNull(),
                isNull(),
                isNull()
        );
        verify(importRepository).insertRow(
                eq(42L),
                eq("Shell Box - NuPay"),
                eq(LocalDate.of(2026, 3, 28).atStartOfDay()),
                eq(33226L),
                eq(EntryDirection.OUT),
                isNull(),
                isNull(),
                isNull(),
                isNull()
        );
    }

    @Test
    @DisplayName("deve aceitar CSV de debito Nubank quando fonte cartao for selecionada")
    void shouldImportNubankDebitCsvWhenCardSourceIsSelected() {
        var csv = """
                Data,Valor,Identificador,Descricao
                28/03/2026,-5.99,69c80df3-cc85-45c6-90e2-8abdf351941e,Compra no debito - SUPER ALIANCA SCHROED
                """;
        var file = new MockMultipartFile(
                "file",
                "Nubank_2026-04-07.csv",
                "text/csv",
                csv.getBytes(StandardCharsets.UTF_8)
        );
        var command = new CreateImportCommand(file, ImportSource.NUBANK_CSV, null, null, null, null);
        var request = ImportRequest.builder()
                .id(43L)
                .status(ImportStatus.PENDING_REVIEW)
                .source(ImportSource.NUBANK_CSV)
                .build();

        when(importRepository.insertRequest(ImportSource.NUBANK_CSV, null, null, null, null)).thenReturn(43L);
        when(importRepository.findRequestById(43L)).thenReturn(Optional.of(request));
        when(importRepository.findRowsByRequestId(43L)).thenReturn(List.of());
        when(importSuggestionService.suggest(any(), any(), isNull())).thenReturn(ImportSuggestion.empty());

        importService.createFromCsv(command);

        verify(importRepository).insertRow(
                eq(43L),
                eq("Compra no debito - SUPER ALIANCA SCHROED"),
                eq(LocalDate.of(2026, 3, 28).atStartOfDay()),
                eq(599L),
                eq(EntryDirection.OUT),
                eq("69c80df3-cc85-45c6-90e2-8abdf351941e"),
                isNull(),
                isNull(),
                isNull()
        );
    }

    @Test
    @DisplayName("deve importar CSV de cartao Nubank com estorno usando sinal separado por espaco")
    void shouldImportNubankCardCsvWithSpacedNegativeAmount() {
        var csv = String.join("\n",
                "date,title,amount",
                "2026-03-26,\"Estorno de \"\"Mercadolivre*Alvesimp\"\"\",\"- 69,87\""
        );
        var file = new MockMultipartFile(
                "file",
                "Nubank_2026-04-07.csv",
                "text/csv",
                csv.getBytes(StandardCharsets.UTF_8)
        );
        var command = new CreateImportCommand(file, ImportSource.NUBANK_CSV, null, null, null, null);
        var request = ImportRequest.builder()
                .id(45L)
                .status(ImportStatus.PENDING_REVIEW)
                .source(ImportSource.NUBANK_CSV)
                .build();

        when(importRepository.insertRequest(ImportSource.NUBANK_CSV, null, null, null, null)).thenReturn(45L);
        when(importRepository.findRequestById(45L)).thenReturn(Optional.of(request));
        when(importRepository.findRowsByRequestId(45L)).thenReturn(List.of());
        when(importSuggestionService.suggest(any(), any(), isNull())).thenReturn(ImportSuggestion.empty());

        importService.createFromCsv(command);

        verify(importRepository).insertRow(
                eq(45L),
                eq("Estorno de \"Mercadolivre*Alvesimp\""),
                eq(LocalDate.of(2026, 3, 26).atStartOfDay()),
                eq(6987L),
                eq(EntryDirection.IN),
                isNull(),
                isNull(),
                isNull(),
                isNull()
        );
    }

    @Test
    @DisplayName("deve preencher categoria natureza e evento sugeridos pelo historico")
    void shouldApplyHistorySuggestionToImportedRow() {
        var csv = """
                date,title,amount
                2026-03-29,Subzero,"9,00"
                """;
        var file = new MockMultipartFile(
                "file",
                "Nubank_2026-04-07.csv",
                "text/csv",
                csv.getBytes(StandardCharsets.UTF_8)
        );
        var command = new CreateImportCommand(file, ImportSource.NUBANK_CSV, null, null, null, null);
        var request = ImportRequest.builder()
                .id(44L)
                .status(ImportStatus.PENDING_REVIEW)
                .source(ImportSource.NUBANK_CSV)
                .build();

        when(importRepository.insertRequest(ImportSource.NUBANK_CSV, null, null, null, null)).thenReturn(44L);
        when(importRepository.findRequestById(44L)).thenReturn(Optional.of(request));
        when(importRepository.findRowsByRequestId(44L)).thenReturn(List.of());
        when(importSuggestionService.suggest("Subzero", EntryDirection.OUT, null))
                .thenReturn(new ImportSuggestion(7L, EntryNature.OPERATIONAL, EconomicEvent.CONSUMPTION, 95));

        importService.createFromCsv(command);

        verify(importRepository).insertRow(
                eq(44L),
                eq("Subzero"),
                eq(LocalDate.of(2026, 3, 29).atStartOfDay()),
                eq(900L),
                eq(EntryDirection.OUT),
                isNull(),
                eq(7L),
                eq(EntryNature.OPERATIONAL),
                eq(EconomicEvent.CONSUMPTION)
        );
    }
}
