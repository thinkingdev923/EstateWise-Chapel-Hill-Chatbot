import type { MarketDataset } from "../types.js";

export const MARKET_DATASETS: MarketDataset[] = [
  {
    id: "austin-tx",
    name: "Austin, TX",
    aliases: ["austin", "austin tx", "texas", "travis county", "pflugerville"],
    summary:
      "Tech hiring has stabilized and inventory remains tight, creating a window for buyers who can move quickly on competitively priced inventory below $650k.",
    datasetVersion: "2024-Q4",
    metrics: {
      medianListPrice: 612_000,
      yoyPriceChange: 2.4,
      inventoryMonths: 2.7,
      rentYield: 4.2,
      affordabilityIndex: 96,
      jobGrowth: 4.1,
    },
    timeline: [
      { month: "May", demandIndex: 58, absorptionRate: 29 },
      { month: "Jun", demandIndex: 61, absorptionRate: 32 },
      { month: "Jul", demandIndex: 65, absorptionRate: 33 },
      { month: "Aug", demandIndex: 68, absorptionRate: 35 },
      { month: "Sep", demandIndex: 71, absorptionRate: 36 },
      { month: "Oct", demandIndex: 69, absorptionRate: 34 },
    ],
    topZips: [
      {
        name: "78745 – South Austin",
        medianPrice: 548_000,
        rentYield: 4.6,
        yoy: 3.1,
      },
      {
        name: "78660 – Pflugerville",
        medianPrice: 489_000,
        rentYield: 4.9,
        yoy: 4.4,
      },
      {
        name: "78702 – East Austin",
        medianPrice: 659_000,
        rentYield: 4.1,
        yoy: 1.8,
      },
    ],
    opportunities: [
      "Builder incentives covering rate buydowns average 1.2% of loan value.",
      "Sub-650k listings receive 40% fewer competing offers than 2023 levels.",
      "Corporate relocations continue to underpin rental absorption in Class B units.",
    ],
    risks: [
      "Luxury segment ($1.2M+) still correcting with higher days-on-market.",
      "Property tax reassessments likely to lift carrying costs mid-2025.",
      "New Class A multifamily supply pressuring top-tier rental growth downtown.",
    ],
    actions: [
      {
        label: "Target energy-efficient rehabs",
        description:
          "Homes built 1995-2008 in South Austin qualify for Austin Energy rebates; upgrading HVAC/insulation boosts rentability and resale value.",
        impact: "high",
      },
      {
        label: "Lock builder rate buydowns",
        description:
          "Pair a 2-1 buydown with lender credits to keep first-year P&I below $3,400 on a $580k purchase.",
        impact: "medium",
      },
      {
        label: "Position for 2025 refinance",
        description:
          "Maintain clean payment history and monitor mid-2025 rate cycle to refinance once spreads compress by 75 bps.",
        impact: "medium",
      },
    ],
  },
  {
    id: "charlotte-nc",
    name: "Charlotte, NC",
    aliases: ["charlotte", "mecklenburg", "charlotte nc", "north carolina"],
    summary:
      "In-migration from the Northeast keeps entry-level inventory extremely tight; rental yields remain healthy with strong bank and fintech hiring.",
    datasetVersion: "2024-Q4",
    metrics: {
      medianListPrice: 432_000,
      yoyPriceChange: 4.7,
      inventoryMonths: 1.9,
      rentYield: 5.5,
      affordabilityIndex: 109,
      jobGrowth: 3.6,
    },
    timeline: [
      { month: "May", demandIndex: 63, absorptionRate: 34 },
      { month: "Jun", demandIndex: 66, absorptionRate: 36 },
      { month: "Jul", demandIndex: 69, absorptionRate: 38 },
      { month: "Aug", demandIndex: 73, absorptionRate: 40 },
      { month: "Sep", demandIndex: 75, absorptionRate: 39 },
      { month: "Oct", demandIndex: 74, absorptionRate: 37 },
    ],
    topZips: [
      {
        name: "28277 – Ballantyne",
        medianPrice: 512_000,
        rentYield: 5.2,
        yoy: 5.1,
      },
      {
        name: "28213 – University City",
        medianPrice: 355_000,
        rentYield: 5.9,
        yoy: 6.3,
      },
      {
        name: "28173 – Weddington",
        medianPrice: 618_000,
        rentYield: 5.0,
        yoy: 4.6,
      },
    ],
    opportunities: [
      "Townhome inventory under $400k clears in fewer than 18 days on average.",
      "Major employers (Bank of America, Honeywell) expanding headcount Q1 2025.",
      "Risk-adjusted rent growth forecasts 5.1% in 2025 across Class B assets.",
    ],
    risks: [
      "Property insurance premiums up 11% YoY across Mecklenburg County.",
      "Impact of recent floodplain remapping increases due-diligence overhead.",
      "Competition from build-to-rent operators in outer-ring suburbs.",
    ],
    actions: [
      {
        label: "Prioritize pre-inspected listings",
        description:
          "Use pre-inspection reports to accelerate closings and avoid protracted repair credits in fast-moving submarkets.",
        impact: "high",
      },
      {
        label: "Layer rent escalators into leases",
        description:
          "Structure 3% year-two escalators to capture projected rent growth while keeping renewal friction low.",
        impact: "medium",
      },
      {
        label: "Evaluate insurance bundling",
        description:
          "Bundle property policies with umbrella coverage to offset double-digit premium increases.",
        impact: "low",
      },
    ],
  },
  {
    id: "phoenix-az",
    name: "Phoenix, AZ",
    aliases: ["phoenix", "arizona", "maricopa"],
    summary:
      "Cooling migration and ample new supply create negotiating leverage, but investors still find strong rent-to-price spreads in workforce housing.",
    datasetVersion: "2024-Q4",
    metrics: {
      medianListPrice: 438_000,
      yoyPriceChange: 0.9,
      inventoryMonths: 3.4,
      rentYield: 5.1,
      affordabilityIndex: 101,
      jobGrowth: 2.8,
    },
    timeline: [
      { month: "May", demandIndex: 49, absorptionRate: 24 },
      { month: "Jun", demandIndex: 51, absorptionRate: 25 },
      { month: "Jul", demandIndex: 54, absorptionRate: 27 },
      { month: "Aug", demandIndex: 58, absorptionRate: 28 },
      { month: "Sep", demandIndex: 60, absorptionRate: 28 },
      { month: "Oct", demandIndex: 59, absorptionRate: 27 },
    ],
    topZips: [
      {
        name: "85032 – Paradise Valley Village",
        medianPrice: 412_000,
        rentYield: 5.4,
        yoy: 2.4,
      },
      {
        name: "85308 – Glendale",
        medianPrice: 396_000,
        rentYield: 5.6,
        yoy: 1.9,
      },
      {
        name: "85225 – Chandler",
        medianPrice: 448_000,
        rentYield: 5.0,
        yoy: 1.3,
      },
    ],
    opportunities: [
      "Seller concessions averaging $9,800 on resales provide room for rate buydowns.",
      "Short-term rental saturation is easing, boosting long-term rental absorption.",
      "Manufacturing projects (TSMC) sustain blue-collar wage growth.",
    ],
    risks: [
      "Water policy changes may affect permitting timelines in 2025.",
      "Heat mitigation retrofits add $6-8k to renovation budgets on older stock.",
      "Insurance carriers scrutinize roof age; plan for replacement credits.",
    ],
    actions: [
      {
        label: "Negotiate seller-paid rate buydowns",
        description:
          "Combine concessions with temporary buydowns to keep first-year cap rates attractive without over-leveraging.",
        impact: "high",
      },
      {
        label: "Budget for heat resilience upgrades",
        description:
          "Allocate $7k for radiant barriers and smart thermostats to improve tenant retention during peak summer months.",
        impact: "medium",
      },
      {
        label: "Screen water policy developments",
        description:
          "Track ADWR announcements to avoid submarkets facing future well restrictions.",
        impact: "low",
      },
    ],
  },
];

export const DEFAULT_DATASET: MarketDataset = {
  id: "national-baseline",
  name: "United States – Composite",
  aliases: ["us", "national", "united states", "usa", "overall"],
  summary:
    "Composite benchmark built from diversified MLS feeds. Use this to compare local traction against national momentum.",
  datasetVersion: "2024-Q4",
  metrics: {
    medianListPrice: 498_000,
    yoyPriceChange: 1.8,
    inventoryMonths: 3.1,
    rentYield: 4.8,
    affordabilityIndex: 102,
    jobGrowth: 2.9,
  },
  timeline: [
    { month: "May", demandIndex: 55, absorptionRate: 29 },
    { month: "Jun", demandIndex: 58, absorptionRate: 30 },
    { month: "Jul", demandIndex: 60, absorptionRate: 31 },
    { month: "Aug", demandIndex: 61, absorptionRate: 31 },
    { month: "Sep", demandIndex: 62, absorptionRate: 30 },
    { month: "Oct", demandIndex: 61, absorptionRate: 29 },
  ],
  topZips: [
    {
      name: "Nashville, TN (37209)",
      medianPrice: 465_000,
      rentYield: 5.1,
      yoy: 3.4,
    },
    {
      name: "Columbus, OH (43230)",
      medianPrice: 328_000,
      rentYield: 5.7,
      yoy: 4.2,
    },
    {
      name: "Tampa, FL (33647)",
      medianPrice: 512_000,
      rentYield: 5.0,
      yoy: 3.1,
    },
  ],
  opportunities: [
    "Rate volatility keeps motivated sellers open to inspection credits.",
    "Household formation is running 1.5% above 10-year trend across Sun Belt metros.",
    "Rent-vs-buy breakeven horizon compressing as rent growth outpaces price gains.",
  ],
  risks: [
    "Insurance premiums remain elevated in coastal markets.",
    "Labor shortages elongate renovation timelines for value-add investors.",
    "Regional bank credit tightening may slow jumbo loan approvals.",
  ],
  actions: [
    {
      label: "Stack lender incentives",
      description:
        "Compare credit union rate locks with buydowns from national lenders to trim effective APR by 40-60 bps.",
      impact: "medium",
    },
    {
      label: "Budget for longer due diligence",
      description:
        "Average appraisal turn time is up to 13 days; bake that into closing timelines to avoid rate lock extensions.",
      impact: "low",
    },
    {
      label: "Monitor insurance riders",
      description:
        "Pair wind/hail deductibles with reserve planning to keep cash flow resilient in high-risk counties.",
      impact: "low",
    },
  ],
};
