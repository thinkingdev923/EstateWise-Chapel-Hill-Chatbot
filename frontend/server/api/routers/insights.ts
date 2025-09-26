import { inferRouterOutputs } from "@trpc/server";
import { z } from "zod";

import { publicProcedure, router } from "../trpc";

type MarketSeriesPoint = {
  month: string;
  demandIndex: number;
  absorptionRate: number;
};

type MarketDataset = {
  id: string;
  name: string;
  queries: string[];
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
  timeline: MarketSeriesPoint[];
  topZips: Array<{
    name: string;
    medianPrice: number;
    rentYield: number;
    yoy: number;
  }>;
  opportunities: string[];
  risks: string[];
  actions: Array<{
    label: string;
    description: string;
    impact: "low" | "medium" | "high";
  }>;
};

const MARKET_DATASETS: MarketDataset[] = [
  {
    id: "austin-tx",
    name: "Austin, TX",
    queries: ["austin", "austin tx", "texas", "travis county", "pflugerville"],
    summary:
      "Tech hiring has stabilized and inventory remains tight, creating a window for buyers who can move quickly on competitively priced inventory below $650k.",
    datasetVersion: "2024-Q4",
    metrics: {
      medianListPrice: 612000,
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
        medianPrice: 548000,
        rentYield: 4.6,
        yoy: 3.1,
      },
      {
        name: "78660 – Pflugerville",
        medianPrice: 489000,
        rentYield: 4.9,
        yoy: 4.4,
      },
      {
        name: "78702 – East Austin",
        medianPrice: 659000,
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
    queries: ["charlotte", "nc", "north carolina", "mecklenburg county"],
    summary:
      "In-migration from the Northeast keeps entry-level inventory extremely tight; rental yields remain healthy with strong bank and fintech hiring.",
    datasetVersion: "2024-Q4",
    metrics: {
      medianListPrice: 432000,
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
        medianPrice: 512000,
        rentYield: 5.2,
        yoy: 5.1,
      },
      {
        name: "28213 – University City",
        medianPrice: 355000,
        rentYield: 5.9,
        yoy: 6.3,
      },
      {
        name: "28173 – Weddington",
        medianPrice: 618000,
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
    queries: ["phoenix", "az", "arizona", "maricopa"],
    summary:
      "Cooling migration and ample new supply create negotiating leverage, but investors still find strong rent-to-price spreads in workforce housing.",
    datasetVersion: "2024-Q4",
    metrics: {
      medianListPrice: 438000,
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
        medianPrice: 412000,
        rentYield: 5.4,
        yoy: 2.4,
      },
      {
        name: "85308 – Glendale",
        medianPrice: 396000,
        rentYield: 5.6,
        yoy: 1.9,
      },
      {
        name: "85225 – Chandler",
        medianPrice: 448000,
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
  {
    id: "chapel-hill-nc",
    name: "Chapel Hill, NC",
    queries: [
      "chapel hill",
      "chapel hill nc",
      "orange county nc",
      "durham-chapel hill",
    ],
    summary:
      "University-town demand from UNC and Research Triangle employers keeps vacancy tight; mid-tier homes see resilient absorption despite higher carrying costs.",
    datasetVersion: "2024-Q4",
    metrics: {
      medianListPrice: 648000,
      yoyPriceChange: 3.2,
      inventoryMonths: 2.4,
      rentYield: 4.1,
      affordabilityIndex: 102,
      jobGrowth: 2.9,
    },
    timeline: [
      { month: "May", demandIndex: 62, absorptionRate: 31 },
      { month: "Jun", demandIndex: 64, absorptionRate: 32 },
      { month: "Jul", demandIndex: 67, absorptionRate: 33 },
      { month: "Aug", demandIndex: 69, absorptionRate: 34 },
      { month: "Sep", demandIndex: 70, absorptionRate: 34 },
      { month: "Oct", demandIndex: 68, absorptionRate: 33 },
    ],
    topZips: [
      {
        name: "27516 – Southern Village",
        medianPrice: 675000,
        rentYield: 4.2,
        yoy: 3.5,
      },
      {
        name: "27514 – East Franklin",
        medianPrice: 628000,
        rentYield: 4.0,
        yoy: 2.7,
      },
      {
        name: "27707 – Chapel Hill/Durham",
        medianPrice: 592000,
        rentYield: 4.4,
        yoy: 3.9,
      },
    ],
    opportunities: [
      "Faculty relocation cycle creates predictable Q2-Q3 leasing surges.",
      "Solar and energy retrofit incentives from Duke Energy reduce operating costs.",
      "Build-to-rent operators focusing on Pittsboro leave in-town supply tight.",
    ],
    risks: [
      "County tax reassessments slated for 2025 could raise escrow payments.",
      "Limited contractor availability extends renovation timelines.",
      "HOA approvals in historic districts can delay exterior upgrades.",
    ],
    actions: [
      {
        label: "Target walk-to-campus inventory",
        description:
          "Two- to four-bedroom homes within bike range of UNC rent rapidly; budget for premium leasing packages to capture graduate student demand.",
        impact: "high",
      },
      {
        label: "Leverage energy retrofit rebates",
        description:
          "Apply Duke Energy rebates to offset HVAC upgrades and market eco-friendly positioning in listings.",
        impact: "medium",
      },
      {
        label: "Balance short-term rentals with regulations",
        description:
          "Review Chapel Hill STR cap rules and consider medium-term rentals for visiting faculty to maintain occupancy.",
        impact: "low",
      },
    ],
  },
  {
    id: "raleigh-nc",
    name: "Raleigh, NC",
    queries: ["raleigh", "wake county", "triangle", "raleigh nc"],
    summary:
      "State government stability and tech hiring sustain demand; multiple build-to-rent communities add competition in outer-ring suburbs.",
    datasetVersion: "2024-Q4",
    metrics: {
      medianListPrice: 489000,
      yoyPriceChange: 4.1,
      inventoryMonths: 2.1,
      rentYield: 5.0,
      affordabilityIndex: 108,
      jobGrowth: 3.4,
    },
    timeline: [
      { month: "May", demandIndex: 65, absorptionRate: 35 },
      { month: "Jun", demandIndex: 67, absorptionRate: 36 },
      { month: "Jul", demandIndex: 70, absorptionRate: 37 },
      { month: "Aug", demandIndex: 72, absorptionRate: 38 },
      { month: "Sep", demandIndex: 73, absorptionRate: 38 },
      { month: "Oct", demandIndex: 71, absorptionRate: 37 },
    ],
    topZips: [
      {
        name: "27603 – Southwest Raleigh",
        medianPrice: 452000,
        rentYield: 5.2,
        yoy: 4.4,
      },
      {
        name: "27616 – Northeast Raleigh",
        medianPrice: 399000,
        rentYield: 5.5,
        yoy: 5.1,
      },
      {
        name: "27587 – Wake Forest",
        medianPrice: 515000,
        rentYield: 4.9,
        yoy: 3.8,
      },
    ],
    opportunities: [
      "Wake Tech expansion increases demand for mid-priced rentals.",
      "State relocations release buy-side concessions above $600k.",
      "Value-add townhomes in Garner show strong rent growth with cosmetic upgrades.",
    ],
    risks: [
      "Insurance premiums up 9% YoY across Wake County.",
      "Construction backlogs for tri-plex builds stretch loan carry costs.",
      "DOT roadworks near I-540 impacting lease-up timing in Holly Springs.",
    ],
    actions: [
      {
        label: "Bid on pre-inspected resales",
        description:
          "Many listings include pre-inspections; use them to accelerate closings and win in competitive bids.",
        impact: "high",
      },
      {
        label: "Hedge insurance costs early",
        description:
          "Bundle property and liability policies and lock rates before renewal increases hit mid-2025.",
        impact: "medium",
      },
      {
        label: "Offer institutional-grade amenities",
        description:
          "Wi-Fi packages and smart locks help differentiate build-to-rent inventory in outer suburbs.",
        impact: "low",
      },
    ],
  },
  {
    id: "durham-nc",
    name: "Durham, NC",
    queries: ["durham", "bull city", "durham nc", "research triangle"],
    summary:
      "Life sciences hiring and Duke Health expansions support rent growth; downtown condo conversions add supply but suburban SFR remains tight.",
    datasetVersion: "2024-Q4",
    metrics: {
      medianListPrice: 428000,
      yoyPriceChange: 5.0,
      inventoryMonths: 2.0,
      rentYield: 5.3,
      affordabilityIndex: 111,
      jobGrowth: 3.7,
    },
    timeline: [
      { month: "May", demandIndex: 66, absorptionRate: 36 },
      { month: "Jun", demandIndex: 68, absorptionRate: 37 },
      { month: "Jul", demandIndex: 71, absorptionRate: 38 },
      { month: "Aug", demandIndex: 74, absorptionRate: 39 },
      { month: "Sep", demandIndex: 75, absorptionRate: 39 },
      { month: "Oct", demandIndex: 73, absorptionRate: 38 },
    ],
    topZips: [
      {
        name: "27713 – Southpoint",
        medianPrice: 452000,
        rentYield: 5.4,
        yoy: 5.2,
      },
      {
        name: "27704 – Northeast Durham",
        medianPrice: 335000,
        rentYield: 5.8,
        yoy: 6.1,
      },
      {
        name: "27705 – Duke Forest",
        medianPrice: 512000,
        rentYield: 5.0,
        yoy: 4.5,
      },
    ],
    opportunities: [
      "Biotech expansions demand short to medium-term furnished rentals.",
      "Downtown adaptive reuse projects offer condo-to-rental arbitrage opportunities.",
      "City incentives for affordable units can offset permit fees in select tracts.",
    ],
    risks: [
      "Property taxes adjusted for bond issuances may lift escrow needs.",
      "Historic district approvals add lead time for exterior work.",
      "Competition from institutional SFR players in RTP submarkets.",
    ],
    actions: [
      {
        label: "Align leases with Duke academic calendar",
        description:
          "Structure August move-ins to match graduate programs, reducing vacancy risk.",
        impact: "high",
      },
      {
        label: "Offer lab-worker focused amenities",
        description:
          "Air filtration upgrades and office nooks attract life-science tenants.",
        impact: "medium",
      },
      {
        label: "Monitor condo conversions downtown",
        description:
          "Track new supply to adjust rent projections for adjacent assets.",
        impact: "low",
      },
    ],
  },
  {
    id: "atlanta-ga",
    name: "Atlanta, GA",
    queries: ["atlanta", "atl", "fulton county", "atlanta ga"],
    summary:
      "Corporate relocations and film industry growth power rental absorption; suburban inventory normalizes but in-town SFR remains supply constrained.",
    datasetVersion: "2024-Q4",
    metrics: {
      medianListPrice: 435000,
      yoyPriceChange: 2.9,
      inventoryMonths: 2.8,
      rentYield: 5.2,
      affordabilityIndex: 104,
      jobGrowth: 3.1,
    },
    timeline: [
      { month: "May", demandIndex: 60, absorptionRate: 30 },
      { month: "Jun", demandIndex: 62, absorptionRate: 31 },
      { month: "Jul", demandIndex: 65, absorptionRate: 32 },
      { month: "Aug", demandIndex: 67, absorptionRate: 32 },
      { month: "Sep", demandIndex: 68, absorptionRate: 31 },
      { month: "Oct", demandIndex: 66, absorptionRate: 30 },
    ],
    topZips: [
      {
        name: "30318 – West Midtown",
        medianPrice: 458000,
        rentYield: 5.3,
        yoy: 3.3,
      },
      {
        name: "30044 – Lawrenceville",
        medianPrice: 362000,
        rentYield: 5.7,
        yoy: 4.1,
      },
      {
        name: "30349 – South Fulton",
        medianPrice: 305000,
        rentYield: 5.9,
        yoy: 4.6,
      },
    ],
    opportunities: [
      "Film studio expansions in Fayette County drive corporate leasing demand.",
      "iBuyers unloading inventory create below-market deals in select ZIPs.",
      "Transit-oriented developments near MARTA lines draw premium rents.",
    ],
    risks: [
      "Insurance costs rising in storm-prone exurbs.",
      "Short-term rental regulations tightening inside Atlanta city limits.",
      "Labor shortages raising renovation bids by 12-15%.",
    ],
    actions: [
      {
        label: "Bundle insurance early",
        description:
          "Lock in multi-property policies to tame double-digit premium increases across the metro.",
        impact: "high",
      },
      {
        label: "Invest in transit-adjacent rehabs",
        description:
          "Target value-add assets within 0.5 miles of MARTA stations where rent premiums average $180/mo.",
        impact: "medium",
      },
      {
        label: "Screen STR ordinances before acquisition",
        description:
          "Confirm zoning when underwriting short-term rental plays to avoid compliance expenditures.",
        impact: "low",
      },
    ],
  },
  {
    id: "denver-co",
    name: "Denver, CO",
    queries: ["denver", "denver metro", "denver co", "mile high"],
    summary:
      "In-migration moderates but hybrid tech and energy employers maintain demand; condo inventory up while detached homes remain competitive.",
    datasetVersion: "2024-Q4",
    metrics: {
      medianListPrice: 612000,
      yoyPriceChange: 1.5,
      inventoryMonths: 3.0,
      rentYield: 4.8,
      affordabilityIndex: 99,
      jobGrowth: 2.6,
    },
    timeline: [
      { month: "May", demandIndex: 57, absorptionRate: 28 },
      { month: "Jun", demandIndex: 59, absorptionRate: 29 },
      { month: "Jul", demandIndex: 62, absorptionRate: 30 },
      { month: "Aug", demandIndex: 64, absorptionRate: 30 },
      { month: "Sep", demandIndex: 65, absorptionRate: 29 },
      { month: "Oct", demandIndex: 63, absorptionRate: 28 },
    ],
    topZips: [
      {
        name: "80211 – Highlands",
        medianPrice: 689000,
        rentYield: 4.5,
        yoy: 2.1,
      },
      {
        name: "80209 – Wash Park",
        medianPrice: 712000,
        rentYield: 4.3,
        yoy: 1.8,
      },
      { name: "80013 – Aurora", medianPrice: 455000, rentYield: 5.1, yoy: 3.2 },
    ],
    opportunities: [
      "Accessory dwelling unit (ADU) reforms enable cash-flow boosts in central neighborhoods.",
      "Corporate relocations in aerospace broaden renter pool in South Denver.",
      "Mountain-west migration keeps build-to-rent demand strong in suburbs like Parker.",
    ],
    risks: [
      "Snowpack variability pressures water policy and long-term permits.",
      "Insurance carriers scrutinize wildfire exposure near the foothills.",
      "Rising HOA dues in resort-style communities impact net operating income.",
    ],
    actions: [
      {
        label: "Add ADUs where zoning allows",
        description:
          "Leverage Denver’s relaxed ADU rules to create secondary income streams on larger lots.",
        impact: "high",
      },
      {
        label: "Budget for mitigation upgrades",
        description:
          "Invest in fire-resistant materials and insurance riders for assets near the Front Range.",
        impact: "medium",
      },
      {
        label: "Monitor HOA budgets annually",
        description:
          "Review HOA reserves and upcoming assessments to protect cash flow projections.",
        impact: "low",
      },
    ],
  },
  {
    id: "seattle-wa",
    name: "Seattle, WA",
    queries: ["seattle", "king county", "seattle wa", "puget sound"],
    summary:
      "Tech hiring is cautious but stabilizing; detached home supply remains tight inside the city while Eastside multifamily adds competition.",
    datasetVersion: "2024-Q4",
    metrics: {
      medianListPrice: 769000,
      yoyPriceChange: 1.9,
      inventoryMonths: 2.6,
      rentYield: 4.0,
      affordabilityIndex: 92,
      jobGrowth: 2.3,
    },
    timeline: [
      { month: "May", demandIndex: 56, absorptionRate: 27 },
      { month: "Jun", demandIndex: 58, absorptionRate: 28 },
      { month: "Jul", demandIndex: 60, absorptionRate: 29 },
      { month: "Aug", demandIndex: 62, absorptionRate: 29 },
      { month: "Sep", demandIndex: 63, absorptionRate: 28 },
      { month: "Oct", demandIndex: 61, absorptionRate: 27 },
    ],
    topZips: [
      {
        name: "98103 – Fremont/Wallingford",
        medianPrice: 785000,
        rentYield: 4.1,
        yoy: 2.3,
      },
      {
        name: "98052 – Redmond",
        medianPrice: 812000,
        rentYield: 4.2,
        yoy: 2.8,
      },
      {
        name: "98115 – North Seattle",
        medianPrice: 748000,
        rentYield: 4.0,
        yoy: 1.7,
      },
    ],
    opportunities: [
      "Light rail expansion spurs premium rents near Roosevelt and Bellevue corridors.",
      "Amazon’s return-to-office policies lift demand for in-city rentals.",
      "Accessory dwelling units popular in Ballard add extra income per lot.",
    ],
    risks: [
      "Property taxes trending higher following levies for schools and transit.",
      "Rent control discussions in Olympia could affect future increases.",
      "Permitting timelines remain long for major remodels.",
    ],
    actions: [
      {
        label: "Target light-rail adjacent assets",
        description:
          "Capitalize on new Lynnwood Link stations where rent premiums exceed $250/mo.",
        impact: "high",
      },
      {
        label: "Layer corporate housing offerings",
        description:
          "Offer furnished leases to capture tech relocation budgets.",
        impact: "medium",
      },
      {
        label: "Plan for permit lead times",
        description:
          "Submit remodel plans early given Seattle’s extended review cycles.",
        impact: "low",
      },
    ],
  },
  {
    id: "miami-fl",
    name: "Miami, FL",
    queries: ["miami", "miami-dade", "south florida", "miami fl"],
    summary:
      "Net in-migration and foreign capital support luxury demand, while climate premiums raise operating costs; suburban SFR stays competitive.",
    datasetVersion: "2024-Q4",
    metrics: {
      medianListPrice: 598000,
      yoyPriceChange: 3.4,
      inventoryMonths: 3.2,
      rentYield: 5.6,
      affordabilityIndex: 86,
      jobGrowth: 3.1,
    },
    timeline: [
      { month: "May", demandIndex: 63, absorptionRate: 31 },
      { month: "Jun", demandIndex: 65, absorptionRate: 32 },
      { month: "Jul", demandIndex: 68, absorptionRate: 33 },
      { month: "Aug", demandIndex: 70, absorptionRate: 33 },
      { month: "Sep", demandIndex: 71, absorptionRate: 32 },
      { month: "Oct", demandIndex: 69, absorptionRate: 31 },
    ],
    topZips: [
      {
        name: "33186 – Kendall",
        medianPrice: 485000,
        rentYield: 5.8,
        yoy: 4.2,
      },
      {
        name: "33160 – Sunny Isles",
        medianPrice: 715000,
        rentYield: 5.5,
        yoy: 3.6,
      },
      {
        name: "33025 – Miramar",
        medianPrice: 402000,
        rentYield: 6.0,
        yoy: 4.8,
      },
    ],
    opportunities: [
      "Corporate relocations from finance/tech maintain downtown luxury demand.",
      "Insurance discounts available for properties with new roofs and impact glass.",
      "Cash deals prevalent; negotiate closing credits on longer DOM listings.",
    ],
    risks: [
      "Windstorm insurance premiums continue to climb sharply.",
      "Sea level resilience retrofits add capital expenditure requirements.",
      "Short-term rental regulations tightening in Miami Beach.",
    ],
    actions: [
      {
        label: "Prioritize resilient upgrades",
        description:
          "Budget for impact windows and elevation audits to secure insurance savings and tenant confidence.",
        impact: "high",
      },
      {
        label: "Diversify lease structures",
        description:
          "Blend annual and seasonal leases to capture high winter rates while maintaining stability.",
        impact: "medium",
      },
      {
        label: "Perform insurance shopping annually",
        description:
          "Use brokers to test surplus lines carriers and lock rates before hurricane season.",
        impact: "low",
      },
    ],
  },
  {
    id: "san-francisco-ca",
    name: "San Francisco, CA",
    queries: ["san francisco", "sf", "bay area", "san francisco ca", "sfo"],
    summary:
      "Tech layoffs stabilized by late 2024; buyers seek concessions, yet core SF still commands premiums. East Bay remains more affordable with strong rent growth.",
    datasetVersion: "2024-Q4",
    metrics: {
      medianListPrice: 995000,
      yoyPriceChange: -1.1,
      inventoryMonths: 3.6,
      rentYield: 3.9,
      affordabilityIndex: 78,
      jobGrowth: 1.9,
    },
    timeline: [
      { month: "May", demandIndex: 50, absorptionRate: 24 },
      { month: "Jun", demandIndex: 52, absorptionRate: 25 },
      { month: "Jul", demandIndex: 54, absorptionRate: 26 },
      { month: "Aug", demandIndex: 56, absorptionRate: 26 },
      { month: "Sep", demandIndex: 57, absorptionRate: 25 },
      { month: "Oct", demandIndex: 55, absorptionRate: 24 },
    ],
    topZips: [
      {
        name: "94110 – Mission",
        medianPrice: 1125000,
        rentYield: 3.8,
        yoy: 0.6,
      },
      {
        name: "94607 – Oakland/Jack London",
        medianPrice: 748000,
        rentYield: 4.4,
        yoy: 2.8,
      },
      {
        name: "94080 – South San Francisco",
        medianPrice: 915000,
        rentYield: 4.1,
        yoy: 1.9,
      },
    ],
    opportunities: [
      "Seller concessions and rate buydowns common above $1.2M as DOM lengthens.",
      "Biotech expansion in South SF and Mission Bay continues to support rental demand.",
      "Propelled relocations to East Bay create rent arbitrage opportunities in Richmond/El Cerrito.",
    ],
    risks: [
      "Vacancy taxes and rent control remain key underwriting considerations.",
      "Insurance costs increasing for older buildings needing seismic upgrades.",
      "Office-to-residential conversions may add supply in SOMA corridors over time.",
    ],
    actions: [
      {
        label: "Negotiate closing credits in high DOM segments",
        description:
          "Focus on listings exceeding 45 days to capture larger credits for rate buydowns or repairs.",
        impact: "high",
      },
      {
        label: "Plan seismic retrofits",
        description:
          "Budget for soft-story upgrades to meet local ordinances and unlock insurance reductions.",
        impact: "medium",
      },
      {
        label: "Evaluate East Bay transit hotspots",
        description:
          "Assets near BART stations continue to outperform on rent growth and occupancy.",
        impact: "low",
      },
    ],
  },
  {
    id: "chicago-il",
    name: "Chicago, IL",
    queries: ["chicago", "chi-town", "cook county", "chicago il"],
    summary:
      "Pent-up demand and limited SFR supply keep entry-level homes competitive; downtown rent growth stabilizes as office backfill progresses.",
    datasetVersion: "2024-Q4",
    metrics: {
      medianListPrice: 369000,
      yoyPriceChange: 2.6,
      inventoryMonths: 2.9,
      rentYield: 5.7,
      affordabilityIndex: 112,
      jobGrowth: 2.4,
    },
    timeline: [
      { month: "May", demandIndex: 58, absorptionRate: 29 },
      { month: "Jun", demandIndex: 60, absorptionRate: 30 },
      { month: "Jul", demandIndex: 63, absorptionRate: 31 },
      { month: "Aug", demandIndex: 65, absorptionRate: 31 },
      { month: "Sep", demandIndex: 66, absorptionRate: 30 },
      { month: "Oct", demandIndex: 64, absorptionRate: 29 },
    ],
    topZips: [
      {
        name: "60647 – Logan Square",
        medianPrice: 512000,
        rentYield: 5.4,
        yoy: 3.5,
      },
      {
        name: "60618 – North Center",
        medianPrice: 535000,
        rentYield: 5.2,
        yoy: 2.9,
      },
      {
        name: "60609 – Bridgeport",
        medianPrice: 315000,
        rentYield: 6.1,
        yoy: 4.7,
      },
    ],
    opportunities: [
      "Limited SFR supply on South Side supports value-add strategies with solid cap rates.",
      "MetroSouth and O’Hare expansions support rental demand near transit corridors.",
      "Class B/C downtown buildings ripe for repositioning to modern amenities.",
    ],
    risks: [
      "Property tax assessments fluctuate, requiring careful escrow budgeting.",
      "Insurance rates spiking due to severe weather in Chicagoland.",
      "Crime perception impacts certain submarkets; security investments may be necessary.",
    ],
    actions: [
      {
        label: "Lock multi-year leases with escalators",
        description:
          "Aim for 3% annual escalators on stabilized Class A/B units to keep pace with expense growth.",
        impact: "high",
      },
      {
        label: "Audit property tax appeals",
        description:
          "Use local consultants to appeal assessments and protect NOI.",
        impact: "medium",
      },
      {
        label: "Enhance security features",
        description:
          "Add smart access and surveillance to boost tenant retention in transitional areas.",
        impact: "low",
      },
    ],
  },
];

const DEFAULT_DATASET: MarketDataset = {
  id: "national-baseline",
  name: "United States – Composite",
  queries: [],
  summary:
    "Composite benchmark built from diversified MLS feeds. Use this to compare local traction against national momentum.",
  datasetVersion: "2024-Q4",
  metrics: {
    medianListPrice: 498000,
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
      medianPrice: 465000,
      rentYield: 5.1,
      yoy: 3.4,
    },
    {
      name: "Columbus, OH (43230)",
      medianPrice: 328000,
      rentYield: 5.7,
      yoy: 4.2,
    },
    {
      name: "Tampa, FL (33647)",
      medianPrice: 512000,
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

const scoreFromDataset = (dataset: MarketDataset) => {
  const { metrics } = dataset;
  const buyingWindow = Math.max(
    25,
    Math.min(
      95,
      90 - metrics.inventoryMonths * 12 + metrics.yoyPriceChange * 4,
    ),
  );
  const rentalDemand = Math.max(
    20,
    Math.min(95, 60 + metrics.rentYield * 5 + metrics.jobGrowth * 3),
  );
  const competition = Math.max(
    15,
    Math.min(
      95,
      80 - metrics.inventoryMonths * 14 + metrics.yoyPriceChange * 5,
    ),
  );
  const risk = Math.max(
    10,
    Math.min(
      90,
      55 - metrics.affordabilityIndex / 2 + metrics.inventoryMonths * 6,
    ),
  );

  return {
    buyingWindow: Math.round(buyingWindow),
    rentalDemand: Math.round(rentalDemand),
    competition: Math.round(competition),
    risk: Math.round(risk),
  };
};

type ScoreState = {
  dataset: MarketDataset;
  score: number;
  hasStrongMatch: boolean;
};

export const insightsRouter = router({
  marketSnapshot: publicProcedure
    .input(
      z
        .object({
          query: z.string().min(2, "Add at least two characters to search"),
        })
        .default({ query: "United States" }),
    )
    .query(({ input }) => {
      const normalized = input.query.trim().toLowerCase();
      const tokens = normalized
        .split(/[^a-z0-9]+/)
        .map((token) => token.trim())
        .filter(Boolean);

      const scored = MARKET_DATASETS.reduce<ScoreState>(
        (best, entry) => {
          let score = 0;
          let hasStrongMatch = false;
          const entryName = entry.name.toLowerCase();

          if (entryName === normalized) {
            score += 100;
            hasStrongMatch = true;
          }

          for (const raw of entry.queries) {
            const queryTerm = raw.toLowerCase();
            const isShort = queryTerm.length <= 3;
            const termTokens = queryTerm.split(/[^a-z0-9]+/).filter(Boolean);
            const tokenMatch = tokens.includes(queryTerm);
            const phraseMatch = !tokenMatch && normalized.includes(queryTerm);
            const allTokensPresent =
              termTokens.length > 1 &&
              termTokens.every((token) => tokens.includes(token));

            if (tokenMatch) {
              score += isShort ? 1 : queryTerm.length + 2;
              if (!isShort) hasStrongMatch = true;
            } else if (allTokensPresent) {
              score += queryTerm.length + termTokens.length;
              hasStrongMatch = true;
            } else if (phraseMatch && !isShort) {
              score += queryTerm.length;
              hasStrongMatch = true;
            }
          }

          if (
            score > best.score ||
            (score === best.score && hasStrongMatch && !best.hasStrongMatch)
          ) {
            return { dataset: entry, score, hasStrongMatch };
          }

          return best;
        },
        { dataset: DEFAULT_DATASET, score: 0, hasStrongMatch: false },
      );

      const dataset = scored.hasStrongMatch ? scored.dataset : DEFAULT_DATASET;

      const scorecard = scoreFromDataset(dataset);
      const [latest] = dataset.timeline.slice(-1);
      const absorptionTrend = dataset.timeline.map((point, index, arr) => {
        const preceding = index === 0 ? point : arr[index - 1];
        const delta = point.absorptionRate - preceding.absorptionRate;
        return { month: point.month, rate: point.absorptionRate, delta };
      });

      return {
        marketLabel: dataset.name,
        datasetId: dataset.id,
        summary: dataset.summary,
        datasetVersion: dataset.datasetVersion,
        metrics: dataset.metrics,
        scorecard,
        timeline: dataset.timeline,
        absorptionTrend,
        latestDemandIndex: latest?.demandIndex ?? null,
        topZips: dataset.topZips,
        opportunities: dataset.opportunities,
        risks: dataset.risks,
        recommendedActions: dataset.actions,
      };
    }),
});

type InsightsRouterOutput = inferRouterOutputs<typeof insightsRouter>;

export type MarketSnapshot = InsightsRouterOutput["marketSnapshot"];
