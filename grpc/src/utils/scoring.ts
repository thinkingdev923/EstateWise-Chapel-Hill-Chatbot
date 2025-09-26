import type { MarketDataset, Scorecard } from "../types.js";

export function buildScorecard(dataset: MarketDataset): Scorecard {
  const { metrics } = dataset;
  const buyingWindow = clamp(
    Math.round(90 - metrics.inventoryMonths * 12 + metrics.yoyPriceChange * 4),
    25,
    95,
  );
  const rentalDemand = clamp(
    Math.round(60 + metrics.rentYield * 5 + metrics.jobGrowth * 3),
    20,
    95,
  );
  const competition = clamp(
    Math.round(80 - metrics.inventoryMonths * 14 + metrics.yoyPriceChange * 5),
    15,
    95,
  );
  const risk = clamp(
    Math.round(
      55 - metrics.affordabilityIndex / 2 + metrics.inventoryMonths * 6,
    ),
    10,
    90,
  );

  return { buyingWindow, rentalDemand, competition, risk };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
