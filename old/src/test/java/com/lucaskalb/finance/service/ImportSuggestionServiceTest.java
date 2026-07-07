package com.lucaskalb.finance.service;

import com.lucaskalb.finance.model.EconomicEvent;
import com.lucaskalb.finance.model.Entry;
import com.lucaskalb.finance.model.EntryDirection;
import com.lucaskalb.finance.model.EntryNature;
import com.lucaskalb.finance.repository.EntryRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ImportSuggestionServiceTest {

    @Mock
    private EntryRepository entryRepository;

    @InjectMocks
    private ImportSuggestionService importSuggestionService;

    @Test
    @DisplayName("deve desempatar sugestoes usando historico mais recente")
    void shouldBreakSuggestionTiesUsingMostRecentHistory() {
        var recent = createEntry(1L, "Super Alianca Schroed", 10L);
        var older = createEntry(2L, "Super Alianca Schroed", 20L);

        when(entryRepository.listSuggestionHistory(EntryDirection.OUT, null, 1000))
                .thenReturn(List.of(recent, older));

        var suggestion = importSuggestionService.suggest("Super Alianca Schroed", EntryDirection.OUT, null);

        assertThat(suggestion.categoryId()).isEqualTo(10L);
        assertThat(suggestion.nature()).isEqualTo(EntryNature.OPERATIONAL);
        assertThat(suggestion.economicEvent()).isEqualTo(EconomicEvent.CONSUMPTION);
    }

    private Entry createEntry(long id, String description, long categoryId) {
        return Entry.builder()
                .id(id)
                .walletId(1L)
                .categoryId(categoryId)
                .nature(EntryNature.OPERATIONAL)
                .direction(EntryDirection.OUT)
                .description(description)
                .economicEvent(EconomicEvent.CONSUMPTION)
                .build();
    }
}
