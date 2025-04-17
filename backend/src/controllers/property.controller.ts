import { Request, Response } from "express";
import { queryProperties } from "../scripts/queryProperties";

export interface Listing {
  id: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  livingArea: number;
  yearBuilt: number;
  homeType: string;
  zipcode?: string;
  [key: string]: any;
}

// 1. Home type distribution (pie)
function buildHomeTypeDistribution(listings: Listing[]) {
  const counts: Record<string, number> = {};
  listings.forEach((l) => {
    const t = l.homeType || "Unknown";
    counts[t] = (counts[t] || 0) + 1;
  });
  return {
    type: "pie",
    data: {
      labels: Object.keys(counts),
      datasets: [{ label: "Home Types", data: Object.values(counts) }],
    },
    options: { responsive: true, plugins: { legend: { position: "top" } } },
  };
}

// 2. Bedrooms distribution (bar)
function buildBedroomsDistribution(listings: Listing[]) {
  const counts: Record<string, number> = {};
  listings.forEach((l) => {
    const b = l.bedrooms.toString();
    counts[b] = (counts[b] || 0) + 1;
  });
  return {
    type: "bar",
    data: {
      labels: Object.keys(counts),
      datasets: [{ label: "Bedrooms", data: Object.values(counts) }],
    },
    options: { responsive: true, plugins: { legend: { position: "top" } } },
  };
}

// 3. Bathrooms distribution (bar)
function buildBathroomsDistribution(listings: Listing[]) {
  const counts: Record<string, number> = {};
  listings.forEach((l) => {
    const b = l.bathrooms.toString();
    counts[b] = (counts[b] || 0) + 1;
  });
  return {
    type: "bar",
    data: {
      labels: Object.keys(counts),
      datasets: [{ label: "Bathrooms", data: Object.values(counts) }],
    },
    options: { responsive: true, plugins: { legend: { position: "top" } } },
  };
}

// 4. Price distribution (histogram-like bar)
function buildPriceDistribution(listings: Listing[]) {
  const prices = listings.map((l) => l.price).sort((a, b) => a - b);
  if (!prices.length) return null;
  const bins = 5;
  const min = prices[0],
    max = prices[prices.length - 1];
  const width = (max - min) / bins;
  const counts = Array(bins).fill(0);
  listings.forEach((l) => {
    const idx = Math.min(Math.floor((l.price - min) / width), bins - 1);
    counts[idx]++;
  });
  const labels = counts.map(
    (_, i) =>
      `$${Math.round(min + i * width)}–${Math.round(min + (i + 1) * width)}`,
  );
  return {
    type: "bar",
    data: { labels, datasets: [{ label: "Price Range", data: counts }] },
    options: {
      responsive: true,
      scales: {
        x: { title: { display: true, text: "Price" } },
        y: { title: { display: true, text: "Count" } },
      },
    },
  };
}

// 5. Living area distribution (histogram-like bar)
function buildLivingAreaDistribution(listings: Listing[]) {
  const areas = listings.map((l) => l.livingArea).sort((a, b) => a - b);
  if (!areas.length) return null;
  const bins = 5;
  const min = areas[0],
    max = areas[areas.length - 1];
  const width = (max - min) / bins;
  const counts = Array(bins).fill(0);
  listings.forEach((l) => {
    const idx = Math.min(Math.floor((l.livingArea - min) / width), bins - 1);
    counts[idx]++;
  });
  const labels = counts.map(
    (_, i) =>
      `${Math.round(min + i * width)}–${Math.round(min + (i + 1) * width)} sqft`,
  );
  return {
    type: "bar",
    data: { labels, datasets: [{ label: "Living Area", data: counts }] },
    options: {
      responsive: true,
      scales: {
        x: { title: { display: true, text: "Sqft" } },
        y: { title: { display: true, text: "Count" } },
      },
    },
  };
}

// 6. Year built distribution (bar)
function buildYearBuiltDistribution(listings: Listing[]) {
  const counts: Record<string, number> = {};
  listings.forEach((l) => {
    const y = l.yearBuilt.toString();
    counts[y] = (counts[y] || 0) + 1;
  });
  return {
    type: "bar",
    data: {
      labels: Object.keys(counts),
      datasets: [{ label: "Year Built", data: Object.values(counts) }],
    },
    options: { responsive: true, plugins: { legend: { position: "top" } } },
  };
}

// 7. Price vs Living Area (scatter)
function buildPriceAreaTrend(listings: Listing[]) {
  const pts = listings.map((l) => ({ x: l.livingArea, y: l.price }));
  return {
    type: "scatter",
    data: { datasets: [{ label: "Price vs Area", data: pts }] },
    options: {
      responsive: true,
      scales: {
        x: { title: { display: true, text: "Sqft" } },
        y: { title: { display: true, text: "$" } },
      },
    },
  };
}

// 8. Price vs Year Built (line)
function buildPriceYearTrend(listings: Listing[]) {
  const sorted = [...listings].sort((a, b) => a.yearBuilt - b.yearBuilt);
  return {
    type: "line",
    data: {
      labels: sorted.map((l) => l.yearBuilt.toString()),
      datasets: [
        {
          label: "Price over Year Built",
          data: sorted.map((l) => l.price),
          fill: false,
        },
      ],
    },
    options: { responsive: true },
  };
}

// 9. Price per sqft distribution (bar)
function buildPricePerSqftDistribution(listings: Listing[]) {
  const values = listings
    .map((l) => +(l.price / l.livingArea || 0).toFixed(2))
    .sort((a, b) => a - b);
  if (!values.length) return null;
  const bins = 5,
    min = values[0],
    max = values[values.length - 1],
    width = (max - min) / bins;
  const counts = Array(bins).fill(0);
  values.forEach((v) => {
    const idx = Math.min(Math.floor((v - min) / width), bins - 1);
    counts[idx]++;
  });
  const labels = counts.map(
    (_, i) =>
      `$${(min + i * width).toFixed(0)}–${(min + (i + 1) * width).toFixed(0)}`,
  );
  return {
    type: "bar",
    data: { labels, datasets: [{ label: "Price per Sqft", data: counts }] },
    options: { responsive: true },
  };
}

// 10. Bedrooms vs Bathrooms (bubble)
function buildBedsBathsScatter(listings: Listing[]) {
  const pts = listings.map((l) => ({ x: l.bedrooms, y: l.bathrooms, r: 5 }));
  return {
    type: "bubble",
    data: { datasets: [{ label: "Beds vs Baths", data: pts }] },
    options: { responsive: true },
  };
}

// 11. Average price by home type (bar)
function buildAveragePriceByHomeType(listings: Listing[]) {
  const sums: Record<string, number> = {},
    counts: Record<string, number> = {};
  listings.forEach((l) => {
    sums[l.homeType] = (sums[l.homeType] || 0) + l.price;
    counts[l.homeType] = (counts[l.homeType] || 0) + 1;
  });
  const labels = Object.keys(sums);
  const data = labels.map((t) => sums[t] / counts[t]);
  return {
    type: "bar",
    data: { labels, datasets: [{ label: "Avg Price", data }] },
    options: { responsive: true },
  };
}

// 12. Count by zipcode (bar)
function buildCountByZipcode(listings: Listing[]) {
  const counts: Record<string, number> = {};
  listings.forEach((l) => {
    const z = l.zipcode || "N/A";
    counts[z] = (counts[z] || 0) + 1;
  });
  return {
    type: "bar",
    data: {
      labels: Object.keys(counts),
      datasets: [{ label: "Count by Zip", data: Object.values(counts) }],
    },
    options: { responsive: true },
  };
}

/**
 * GET /api/properties?q=…&topK=…
 */
export async function getPropertyData(req: Request, res: Response) {
  try {
    const q = String(req.query.q || "");
    const topK = Number(req.query.topK) || 500;
    const raw = await queryProperties(q, topK);
    const listings: Listing[] = raw.map((r) => {
      const m = r.metadata as any;
      return {
        id: r.id,
        price: Number(m.price) || 0,
        bedrooms: Number(m.bedrooms) || 0,
        bathrooms: Number(m.bathrooms) || 0,
        livingArea: Number(m.livingArea) || 0,
        yearBuilt: Number(m.yearBuilt) || 0,
        homeType: String(m.homeType || ""),
        zipcode: String(m.zipcode || ""),
      };
    });

    const charts = {
      homeType: buildHomeTypeDistribution(listings),
      bedrooms: buildBedroomsDistribution(listings),
      bathrooms: buildBathroomsDistribution(listings),
      priceDist: buildPriceDistribution(listings),
      areaDist: buildLivingAreaDistribution(listings),
      yearBuiltDist: buildYearBuiltDistribution(listings),
      priceArea: buildPriceAreaTrend(listings),
      priceYear: buildPriceYearTrend(listings),
      pricePerSqft: buildPricePerSqftDistribution(listings),
      bedsBaths: buildBedsBathsScatter(listings),
      avgPriceType: buildAveragePriceByHomeType(listings),
      countByZip: buildCountByZipcode(listings),
    };

    res.json({ listings, charts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch property data" });
  }
}
