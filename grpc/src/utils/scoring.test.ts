import { describe, expect, it } from "vitest";

import { MARKET_DATASETS } from "../data/datasets";
import { buildScorecard } from "./scoring";

describe("buildScorecard", () => {
  it("produces bounded scores", () => {
    const dataset = MARKET_DATASETS[0];
    const scorecard = buildScorecard(dataset);
    expect(
      Object.values(scorecard).every((value) => value >= 0 && value <= 100),
    ).toBe(true);
  });

  it("adjusts competition when inventory changes", () => {
    const dataset = {
      ...MARKET_DATASETS[0],
      metrics: { ...MARKET_DATASETS[0].metrics, inventoryMonths: 6 },
    };
    const { competition } = buildScorecard(dataset);
    expect(competition).toBeLessThan(60);
  });
});
