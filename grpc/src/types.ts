export type TrendPoint = {
  month: string;
  demandIndex: number;
  absorptionRate: number;
};

export type HotZip = {
  name: string;
  medianPrice: number;
  rentYield: number;
  yoy: number;
};

export type RecommendedAction = {
  label: string;
  description: string;
  impact: "low" | "medium" | "high";
};

export type MarketDataset = {
  id: string;
  name: string;
  aliases: string[];
  summary: string;
  datasetVersion: string;
  metrics: {
    medianListPrice: number;
    yoyPriceChange: number;
    inventoryMonths: number;
    rentYield: number;
    affordabilityIndex: number;
    jobGrowth: number;
  };
  timeline: TrendPoint[];
  topZips: HotZip[];
  opportunities: string[];
  risks: string[];
  actions: RecommendedAction[];
};

export type Scorecard = {
  buyingWindow: number;
  rentalDemand: number;
  competition: number;
  risk: number;
};

export type DatasetResolution = {
  dataset: MarketDataset;
  fallbackNotice: string | null;
};
