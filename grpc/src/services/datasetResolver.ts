import { DEFAULT_DATASET, MARKET_DATASETS } from "../data/datasets";
import type { DatasetResolution, MarketDataset } from "../types";

type ScoreState = {
  dataset: MarketDataset;
  score: number;
  exactMatch: boolean;
};

export function resolveDataset(query: string): DatasetResolution {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return {
      dataset: DEFAULT_DATASET,
      fallbackNotice:
        "No query provided; returning national composite benchmark.",
    };
  }

  const tokens = normalized
    .split(/[^a-z0-9]+/)
    .map((token) => token.trim())
    .filter(Boolean);

  const scored = MARKET_DATASETS.reduce<ScoreState>(
    (best, dataset) => {
      let score = 0;
      let exactMatch = false;
      const datasetName = dataset.name.toLowerCase();

      if (datasetName === normalized) {
        score += 100;
        exactMatch = true;
      }

      for (const alias of dataset.aliases) {
        const candidate = alias.toLowerCase();
        const isShort = candidate.length <= 3;
        const aliasTokens = candidate.split(/[^a-z0-9]+/).filter(Boolean);
        const tokenMatch = tokens.includes(candidate);
        const phraseMatch = !tokenMatch && normalized.includes(candidate);
        const allTokensPresent =
          aliasTokens.length > 1 &&
          aliasTokens.every((token) => tokens.includes(token));

        if (tokenMatch) {
          score += isShort ? 1 : candidate.length + 2;
          if (!isShort) exactMatch = true;
        } else if (allTokensPresent) {
          score += candidate.length + aliasTokens.length;
          exactMatch = true;
        } else if (phraseMatch && !isShort) {
          score += candidate.length;
          exactMatch = true;
        }
      }

      if (
        score > best.score ||
        (score === best.score && exactMatch && !best.exactMatch)
      ) {
        return { dataset, score, exactMatch };
      }
      return best;
    },
    { dataset: DEFAULT_DATASET, score: 0, exactMatch: false },
  );

  const dataset: MarketDataset = scored.exactMatch
    ? scored.dataset
    : DEFAULT_DATASET;
  const fallbackNotice = scored.exactMatch
    ? null
    : `Showing the ${dataset.name} dataset while we curate coverage for "${query}".`;

  return { dataset, fallbackNotice };
}

export function listDatasets(search = ""): MarketDataset[] {
  const normalized = search.trim().toLowerCase();
  if (!normalized) return MARKET_DATASETS;
  return MARKET_DATASETS.filter((dataset) => {
    const haystack = [dataset.name, ...dataset.aliases].map((value) =>
      value.toLowerCase(),
    );
    return haystack.some((value) => value.includes(normalized));
  });
}
