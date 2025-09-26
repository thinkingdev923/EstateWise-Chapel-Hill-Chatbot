import { describe, expect, it } from "vitest";

import { DEFAULT_DATASET, MARKET_DATASETS } from "../data/datasets";
import { resolveDataset } from "./datasetResolver";

describe("resolveDataset", () => {
  it("returns default dataset for empty search", () => {
    const { dataset, fallbackNotice } = resolveDataset("");
    expect(dataset.id).toEqual(DEFAULT_DATASET.id);
    expect(fallbackNotice).toBeTruthy();
  });

  it("returns specific dataset when alias matches", () => {
    const { dataset, fallbackNotice } = resolveDataset("Charlotte, NC");
    expect(dataset.id).toEqual("charlotte-nc");
    expect(fallbackNotice).toBeNull();
  });

  it("returns best match when tokens overlap partially", () => {
    const { dataset } = resolveDataset("Looking around Pflugerville area");
    expect(dataset.id).toEqual("austin-tx");
  });

  it("falls back gracefully for unknown markets", () => {
    const { dataset, fallbackNotice } = resolveDataset("Chapel Hill, NC");
    expect(dataset.id).toBe(DEFAULT_DATASET.id);
    expect(fallbackNotice).toContain("Chapel Hill");
  });

  it("lists curated datasets using list alias", () => {
    const knownAliases = MARKET_DATASETS.flatMap((dataset) => dataset.aliases);
    expect(knownAliases.length).toBeGreaterThan(0);
  });
});
