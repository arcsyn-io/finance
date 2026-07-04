package com.lucaskalb.finance.service;

import com.lucaskalb.finance.dto.ImportSuggestion;
import com.lucaskalb.finance.model.EconomicEvent;
import com.lucaskalb.finance.model.Entry;
import com.lucaskalb.finance.model.EntryDirection;
import com.lucaskalb.finance.model.EntryNature;
import com.lucaskalb.finance.repository.EntryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.text.Normalizer;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ImportSuggestionService {

    private static final int MIN_SCORE = 55;
    private static final int HISTORY_LIMIT = 1000;
    private static final Set<String> STOP_WORDS = Set.of(
            "compra", "debito", "credito", "cartao", "nubank", "pagamento",
            "recebido", "nu", "pay", "nupay", "de", "do", "da", "no", "na", "em"
    );

    private final EntryRepository entryRepository;

    public ImportSuggestion suggest(String description, EntryDirection direction, Long walletId) {
        var normalized = normalize(description);
        if (normalized.isBlank()) {
            return ImportSuggestion.empty();
        }

        var tokens = tokens(normalized);
        if (tokens.isEmpty()) {
            return ImportSuggestion.empty();
        }

        var candidates = entryRepository.listSuggestionHistory(direction, walletId, HISTORY_LIMIT);
        var scores = new HashMap<SuggestionKey, SuggestionStats>();

        for (int index = 0; index < candidates.size(); index++) {
            var historyIndex = index;
            var candidate = candidates.get(index);
            var candidateDescription = normalize(candidate.getDescription());
            var score = score(normalized, tokens, candidateDescription);
            if (score < MIN_SCORE) {
                continue;
            }

            var key = new SuggestionKey(candidate.getCategoryId(), candidate.getNature(), candidate.getEconomicEvent());
            scores.computeIfAbsent(key, ignored -> new SuggestionStats(historyIndex)).add(score);
        }

        return scores.entrySet().stream()
                .max((left, right) -> compareStats(left.getValue(), right.getValue()))
                .map(entry -> {
                    var key = entry.getKey();
                    var confidence = Math.min(100, entry.getValue().totalScore());
                    return new ImportSuggestion(key.categoryId(), key.nature(), key.economicEvent(), confidence);
                })
                .orElseGet(ImportSuggestion::empty);
    }

    private int compareStats(SuggestionStats left, SuggestionStats right) {
        var totalScore = Integer.compare(left.totalScore(), right.totalScore());
        if (totalScore != 0) {
            return totalScore;
        }

        var count = Integer.compare(left.count(), right.count());
        if (count != 0) {
            return count;
        }

        return Integer.compare(right.firstHistoryIndex(), left.firstHistoryIndex());
    }

    private int score(String description, Set<String> tokens, String candidateDescription) {
        if (candidateDescription.isBlank()) {
            return 0;
        }

        if (description.equals(candidateDescription)) {
            return 100;
        }

        if (description.contains(candidateDescription) || candidateDescription.contains(description)) {
            return 85;
        }

        var candidateTokens = tokens(candidateDescription);
        if (candidateTokens.isEmpty()) {
            return 0;
        }

        var intersection = tokens.stream()
                .filter(candidateTokens::contains)
                .count();
        var smallerTokenSet = Math.min(tokens.size(), candidateTokens.size());

        if (smallerTokenSet == 0) {
            return 0;
        }

        var ratio = (double) intersection / smallerTokenSet;
        return (int) Math.round(ratio * 80);
    }

    private Set<String> tokens(String value) {
        return Arrays.stream(value.split(" "))
                .filter(token -> token.length() > 2)
                .filter(token -> !STOP_WORDS.contains(token))
                .collect(Collectors.toSet());
    }

    private String normalize(String value) {
        if (value == null) {
            return "";
        }

        var withoutAccents = Normalizer.normalize(value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");

        return withoutAccents
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9 ]", " ")
                .replaceAll("\\s+", " ")
                .trim();
    }

    private record SuggestionKey(Long categoryId, EntryNature nature, EconomicEvent economicEvent) {}

    private static final class SuggestionStats {
        private int totalScore;
        private int count;
        private final int firstHistoryIndex;

        private SuggestionStats(int firstHistoryIndex) {
            this.firstHistoryIndex = firstHistoryIndex;
        }

        private void add(int score) {
            totalScore += score;
            count++;
        }

        private int totalScore() {
            return totalScore;
        }

        private int count() {
            return count;
        }

        private int firstHistoryIndex() {
            return firstHistoryIndex;
        }
    }
}
