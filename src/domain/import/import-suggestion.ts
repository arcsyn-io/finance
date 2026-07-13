import type {
  EconomicEvent,
  EntryNature,
} from "@/domain/entry/entry";

export type ImportSuggestionHistoryEntry = {
  readonly categoryId: string;
  readonly nature: EntryNature;
  readonly economicEvent: EconomicEvent | null;
  readonly description: string | null;
};

export type ImportFieldSuggestion = {
  readonly categoryId: string | null;
  readonly nature: EntryNature | null;
  readonly economicEvent: EconomicEvent | null;
  readonly confidence: number;
};

const minimumScore = 55;
const combiningMarksPattern = new RegExp("\\p{M}", "gu");

const stopWords = new Set([
  "compra",
  "debito",
  "credito",
  "cartao",
  "nubank",
  "pagamento",
  "recebido",
  "nu",
  "pay",
  "nupay",
  "de",
  "do",
  "da",
  "no",
  "na",
  "em",
]);

export function hasImportSuggestionTokens(
  description: string | null,
): boolean {
  return tokens(normalize(description)).size > 0;
}

export function suggestImportFields(
  description: string | null,
  history: readonly ImportSuggestionHistoryEntry[],
): ImportFieldSuggestion {
  const normalizedDescription = normalize(description);
  const descriptionTokens = tokens(normalizedDescription);

  if (!normalizedDescription || descriptionTokens.size === 0) {
    return emptySuggestion();
  }

  const aggregated = new Map<string, SuggestionStats>();

  history.forEach((candidate, historyIndex) => {
    const candidateDescription = normalize(candidate.description);
    const candidateScore = score(
      normalizedDescription,
      descriptionTokens,
      candidateDescription,
    );

    if (candidateScore < minimumScore) return;

    const key = JSON.stringify([
      candidate.categoryId,
      candidate.nature,
      candidate.economicEvent,
    ]);
    const current = aggregated.get(key);

    if (current) {
      current.totalScore += candidateScore;
      current.count += 1;
      return;
    }

    aggregated.set(key, {
      categoryId: candidate.categoryId,
      nature: candidate.nature,
      economicEvent: candidate.economicEvent,
      totalScore: candidateScore,
      count: 1,
      firstHistoryIndex: historyIndex,
    });
  });

  let winner: SuggestionStats | null = null;

  for (const candidate of aggregated.values()) {
    if (!winner || compareSuggestionStats(candidate, winner) > 0) {
      winner = candidate;
    }
  }

  if (!winner) return emptySuggestion();

  return {
    categoryId: winner.categoryId,
    nature: winner.nature,
    economicEvent: winner.economicEvent,
    confidence: Math.min(100, winner.totalScore),
  };
}

type SuggestionStats = {
  readonly categoryId: string;
  readonly nature: EntryNature;
  readonly economicEvent: EconomicEvent | null;
  totalScore: number;
  count: number;
  readonly firstHistoryIndex: number;
};

function compareSuggestionStats(
  left: SuggestionStats,
  right: SuggestionStats,
): number {
  if (left.totalScore !== right.totalScore) {
    return left.totalScore - right.totalScore;
  }

  if (left.count !== right.count) {
    return left.count - right.count;
  }

  return right.firstHistoryIndex - left.firstHistoryIndex;
}

function score(
  description: string,
  descriptionTokens: ReadonlySet<string>,
  candidateDescription: string,
): number {
  if (!candidateDescription) return 0;
  if (description === candidateDescription) return 100;
  if (
    description.includes(candidateDescription) ||
    candidateDescription.includes(description)
  ) {
    return 85;
  }

  const candidateTokens = tokens(candidateDescription);
  if (candidateTokens.size === 0) return 0;

  let intersection = 0;
  for (const token of descriptionTokens) {
    if (candidateTokens.has(token)) intersection += 1;
  }

  const smallerTokenSet = Math.min(
    descriptionTokens.size,
    candidateTokens.size,
  );
  if (smallerTokenSet === 0) return 0;

  return Math.round((intersection / smallerTokenSet) * 80);
}

function tokens(value: string): ReadonlySet<string> {
  return new Set(
    value
      .split(" ")
      .filter((token) => token.length > 2)
      .filter((token) => !stopWords.has(token)),
  );
}

function normalize(value: string | null): string {
  if (!value) return "";

  return value
    .normalize("NFD")
    .replace(combiningMarksPattern, "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function emptySuggestion(): ImportFieldSuggestion {
  return {
    categoryId: null,
    nature: null,
    economicEvent: null,
    confidence: 0,
  };
}
