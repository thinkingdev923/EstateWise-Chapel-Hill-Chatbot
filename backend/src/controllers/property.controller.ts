import { Request, Response } from "express";
import { queryProperties } from "../scripts/queryProperties";
import { index } from "../pineconeClient";
import Property from "../models/Property.model";

/**
 * Represents a property listing with relevant metadata.
 */
export interface Listing {
  id: string;
  score: number;
  price: number;
  bedrooms: number;
  bathrooms: number;
  livingArea: number;
  yearBuilt: number;
  homeType: string;
  homeStatus: string;
  city: string;
  zipcode?: string;
  latitude?: number;
  longitude?: number;
  [key: string]: any;
}

/**
 * Builds a pie chart config for home type distribution.
 * @param listings Array of property listings
 */
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

/**
 * Builds a bar chart config for bedrooms distribution.
 * @param listings Array of property listings
 */
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

/**
 * Builds a bar chart config for bathrooms distribution.
 * @param listings Array of property listings
 */
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

/**
 * Builds a histogram-like bar chart for price distribution.
 * @param listings Array of property listings
 */
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

/**
 * Builds a histogram-like bar chart for living area distribution.
 * @param listings Array of property listings
 */
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

/**
 * Builds a bar chart for year built distribution.
 * @param listings Array of property listings
 */
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

/**
 * Builds a scatter chart for price vs living area.
 * @param listings Array of property listings
 */
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

/**
 * Builds a line chart for price over year built.
 * @param listings Array of property listings
 */
function buildPriceYearTrend(listings: Listing[]) {
  const sorted = [...listings].sort((a, b) => a.yearBuilt - b.yearBuilt);
  return {
    type: "line",
    data: {
      labels: sorted.map((l) => l.yearBuilt.toString()),
      datasets: [
        {
          label: "Price over Year",
          data: sorted.map((l) => l.price),
          fill: false,
        },
      ],
    },
    options: { responsive: true },
  };
}

/**
 * Builds a bar chart for price per square foot distribution.
 * @param listings Array of property listings
 */
function buildPricePerSqftDistribution(listings: Listing[]) {
  const values = listings
    .map((l) => +(l.price / (l.livingArea || 1)).toFixed(2))
    .sort((a, b) => a - b);
  if (!values.length) return null;
  const bins = 5;
  const min = values[0],
    max = values[values.length - 1];
  const width = (max - min) / bins;
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

/**
 * Builds a bubble chart for bedrooms vs bathrooms.
 * @param listings Array of property listings
 */
function buildBedsBathsScatter(listings: Listing[]) {
  const pts = listings.map((l) => ({ x: l.bedrooms, y: l.bathrooms, r: 5 }));
  return {
    type: "bubble",
    data: { datasets: [{ label: "Beds vs Baths", data: pts }] },
    options: { responsive: true },
  };
}

/**
 * Builds a bar chart for average price by home type.
 * @param listings Array of property listings
 */
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

/**
 * Builds a bar chart for count by zipcode.
 * @param listings Array of property listings
 */
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
 * Builds a doughnut chart for home status distribution.
 * @param listings Array of property listings
 */
function buildHomeStatusDistribution(listings: Listing[]) {
  const counts: Record<string, number> = {};
  listings.forEach((l) => {
    const s = l.homeStatus || "Unknown";
    counts[s] = (counts[s] || 0) + 1;
  });
  return {
    type: "doughnut",
    data: {
      labels: Object.keys(counts),
      datasets: [{ label: "Home Status", data: Object.values(counts) }],
    },
    options: { responsive: true },
  };
}

/**
 * Builds a bar chart for count by city.
 * @param listings Array of property listings
 */
function buildCountByCity(listings: Listing[]) {
  const counts: Record<string, number> = {};
  listings.forEach((l) => {
    const c = l.city || "Unknown";
    counts[c] = (counts[c] || 0) + 1;
  });
  return {
    type: "bar",
    data: {
      labels: Object.keys(counts),
      datasets: [{ label: "Count by City", data: Object.values(counts) }],
    },
    options: { responsive: true },
  };
}

/**
 * Builds a bar chart for average living area by home type.
 * @param listings Array of property listings
 */
function buildAverageLivingAreaByHomeType(listings: Listing[]) {
  const sums: Record<string, number> = {},
    counts: Record<string, number> = {};
  listings.forEach((l) => {
    sums[l.homeType] = (sums[l.homeType] || 0) + l.livingArea;
    counts[l.homeType] = (counts[l.homeType] || 0) + 1;
  });
  const labels = Object.keys(sums);
  const data = labels.map((t) => sums[t] / counts[t]);
  return {
    type: "bar",
    data: { labels, datasets: [{ label: "Avg Living Area", data }] },
    options: { responsive: true },
  };
}

/**
 * Builds a histogram-like bar chart for property age distribution.
 * @param listings Array of property listings
 */
function buildAgeDistribution(listings: Listing[]) {
  const currentYear = new Date().getFullYear();
  const ages = listings
    .map((l) => currentYear - l.yearBuilt)
    .sort((a, b) => a - b);
  if (!ages.length) return null;
  const bins = 5;
  const min = ages[0],
    max = ages[ages.length - 1];
  const width = (max - min) / bins;
  const counts = Array(bins).fill(0);
  listings.forEach((l) => {
    const age = currentYear - l.yearBuilt;
    const idx = Math.min(Math.floor((age - min) / width), bins - 1);
    counts[idx]++;
  });
  const labels = counts.map(
    (_, i) =>
      `${Math.round(min + i * width)}–${Math.round(min + (i + 1) * width)} years`,
  );
  return {
    type: "bar",
    data: { labels, datasets: [{ label: "Age Range", data: counts }] },
    options: {
      responsive: true,
      scales: {
        x: { title: { display: true, text: "Age (years)" } },
        y: { title: { display: true, text: "Count" } },
      },
    },
  };
}

/**
 * Builds a bar chart for average price per square foot by home type.
 * @param listings Array of property listings
 */
function buildAveragePricePerSqftByHomeType(listings: Listing[]) {
  const sums: Record<string, number> = {},
    counts: Record<string, number> = {};
  listings.forEach((l) => {
    const type = l.homeType || "Unknown";
    const ppsqft = l.price / (l.livingArea || 1);
    sums[type] = (sums[type] || 0) + ppsqft;
    counts[type] = (counts[type] || 0) + 1;
  });
  const labels = Object.keys(sums);
  const data = labels.map((t) => +(sums[t] / counts[t]).toFixed(2));
  return {
    type: "bar",
    data: { labels, datasets: [{ label: "Avg $/Sqft", data }] },
    options: {
      responsive: true,
      scales: {
        x: { title: { display: true, text: "Home Type" } },
        y: { title: { display: true, text: "Avg Price per Sqft" } },
      },
    },
  };
}

/**
 * Builds a scatter chart for living area vs year built.
 * @param listings Array of property listings
 */
function buildAreaYearScatter(listings: Listing[]) {
  const pts = listings.map((l) => ({ x: l.yearBuilt, y: l.livingArea }));
  return {
    type: "scatter",
    data: { datasets: [{ label: "Area vs Year", data: pts }] },
    options: {
      responsive: true,
      scales: {
        x: { title: { display: true, text: "Year" } },
        y: { title: { display: true, text: "Sqft" } },
      },
    },
  };
}

/**
 * GET /api/properties?q=…&topK=…
 * Fetch property data, parse metadata, filter out yearBuilt === 0,
 * and return exactly 1500 listings with chart configurations.
 *
 * @param req Express request
 * @param res Express response
 */
export async function getPropertyData(req: Request, res: Response) {
  try {
    const q = String(req.query.q || "");
    // Fetch up to `topK` results (default to 1500 to ensure enough after filtering)
    const desiredCount = 1500;
    const rawTopK = Number(req.query.topK) || desiredCount;
    const raw = await queryProperties(q, rawTopK);

    // Map raw results to Listing objects
    const allListings: Listing[] = raw.map((r) => {
      const m = r.metadata as any;
      const addr = JSON.parse(m.address || "{}");
      return {
        id: r.id,
        score: r.score || 0,
        price: Number(m.price) || 0,
        bedrooms: Number(m.bedrooms) || 0,
        bathrooms: Number(m.bathrooms) || 0,
        livingArea: Number(m.livingArea) || 0,
        yearBuilt: Number(m.yearBuilt) || 0,
        homeType: String(m.homeType || ""),
        homeStatus: String(m.homeStatus || ""),
        city: String(m.city || ""),
        zipcode: String(addr.zipcode || ""),
        latitude: m.latitude != null ? Number(m.latitude) : undefined,
        longitude: m.longitude != null ? Number(m.longitude) : undefined,
      };
    });

    // Filter out any listings where yearBuilt is 0
    let listings = allListings.filter((l) => l.yearBuilt !== 0);

    // Ensure we return exactly `desiredCount` listings
    listings = listings.slice(0, desiredCount);

    // Build all the charts
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
      homeStatus: buildHomeStatusDistribution(listings),
      countByCity: buildCountByCity(listings),
      avgAreaType: buildAverageLivingAreaByHomeType(listings),
      ageDist: buildAgeDistribution(listings),
      avgPricePerSqftType: buildAveragePricePerSqftByHomeType(listings),
      areaYear: buildAreaYearScatter(listings),
    };

    res.json({ listings, charts });
  } catch (err: unknown) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch property data" });
  }
}

/**
 * GET /api/properties/by-ids?ids=123,456
 * Fetch property metadata for specific zpids, including lat/lon for mapping.
 */
export async function getPropertiesByIds(req: Request, res: Response) {
  try {
    const idsParam = String(req.query.ids || "").trim();
    if (!idsParam) return res.json({ listings: [] });
    const ids = idsParam
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    if (!ids.length) return res.json({ listings: [] });

    let listings: any[] = [];
    try {
      // Try via Pinecone metadata
      const fetchRes = await index.fetch(ids);
      const vectors =
        (fetchRes as any).records || (fetchRes as any).vectors || {};
      listings = Object.entries(vectors).map(([id, rec]: any) => {
        const m = rec?.metadata || {};
        // metadata.address is JSON string in our pipeline
        let zipcode = "";
        try {
          const addr = m.address ? JSON.parse(m.address) : {};
          zipcode = addr.zipcode || "";
        } catch {
          // ignore
        }
        return {
          id,
          score: 0,
          price: Number(m.price) || 0,
          bedrooms: Number(m.bedrooms) || 0,
          bathrooms: Number(m.bathrooms) || 0,
          livingArea: Number(m.livingArea) || 0,
          yearBuilt: Number(m.yearBuilt) || 0,
          homeType: String(m.homeType || ""),
          homeStatus: String(m.homeStatus || ""),
          city: String(m.city || ""),
          zipcode,
          latitude: m.latitude != null ? Number(m.latitude) : undefined,
          longitude: m.longitude != null ? Number(m.longitude) : undefined,
          zpid: m.zpid != null ? Number(m.zpid) : Number(id),
        };
      });
    } catch (e) {
      // ignore, fall back to Mongo
    }

    // Fallback to Mongo if needed or to enrich
    if (
      listings.length === 0 ||
      listings.some((l) => l.latitude == null || l.longitude == null)
    ) {
      const zpidsNum = ids
        .map((s) => Number(s))
        .filter((n) => Number.isFinite(n));
      const docs = await Property.find({ zpid: { $in: zpidsNum } }).limit(
        zpidsNum.length,
      );
      const byId = new Map<number, any>();
      docs.forEach((d) => byId.set(d.zpid, d));
      listings = ids.map((id) => {
        const z = Number(id);
        const d = byId.get(z);
        if (!d) return { id, zpid: z };
        return {
          id: String(z),
          zpid: z,
          price: d.price,
          bedrooms: d.bedrooms,
          bathrooms: d.bathrooms,
          livingArea: d.livingArea,
          yearBuilt: d.yearBuilt,
          homeType: d.homeType,
          homeStatus: d.homeStatus,
          city: d.city,
          zipcode: d.address?.zipcode,
          latitude: (d as any).latitude,
          longitude: (d as any).longitude,
        };
      });
    }

    return res.json({ listings });
  } catch (err) {
    console.error("getPropertiesByIds error", err);
    return res.status(500).json({ error: "Failed to fetch properties by ids" });
  }
}

/**
 * GET /api/properties/lookup
 * Lightweight lookup endpoint to find candidate ZPIDs by address/city/state/zipcode and optional beds/baths.
 * Returns a compact list suitable for client selection UIs.
 */
export async function lookupZpids(req: Request, res: Response) {
  try {
    const address = String(req.query.address || "").trim();
    const city = String(req.query.city || "").trim();
    const state = String(req.query.state || "").trim();
    const zipcode = String(req.query.zipcode || "").trim();
    const beds = req.query.beds != null ? Number(req.query.beds) : undefined;
    const baths = req.query.baths != null ? Number(req.query.baths) : undefined;
    const limit = Math.min(Number(req.query.limit || 10), 50);

    if (
      !address &&
      !city &&
      !state &&
      !zipcode &&
      beds == null &&
      baths == null
    ) {
      return res.status(400).json({
        error:
          "Provide at least one filter (address, city, state, zipcode, beds, baths)",
      });
    }

    const parts: string[] = [];
    if (address) parts.push(address);
    if (city) parts.push(city);
    if (state) parts.push(state);
    if (zipcode) parts.push(zipcode);
    if (beds != null) parts.push(`${beds} bed`);
    if (baths != null) parts.push(`${baths} bath`);
    const q = parts.join(" ").trim();

    const raw = await queryProperties(q, limit);
    const matches = raw.map((r) => {
      const m = r.metadata as any;
      let addr: any = {};
      try {
        addr = m.address ? JSON.parse(m.address) : {};
      } catch {}
      return {
        id: r.id,
        zpid: m.zpid != null ? Number(m.zpid) : Number(r.id),
        score: r.score || 0,
        streetAddress: addr.streetAddress || "",
        city: m.city || addr.city || "",
        state: addr.state || "",
        zipcode: addr.zipcode || "",
        price: m.price != null ? Number(m.price) : undefined,
        bedrooms: m.bedrooms != null ? Number(m.bedrooms) : undefined,
        bathrooms: m.bathrooms != null ? Number(m.bathrooms) : undefined,
        livingArea: m.livingArea != null ? Number(m.livingArea) : undefined,
        yearBuilt: m.yearBuilt != null ? Number(m.yearBuilt) : undefined,
      };
    });
    return res.json({ query: q, count: matches.length, matches });
  } catch (err) {
    console.error("lookupZpids error", err);
    return res.status(500).json({ error: "Failed to lookup ZPIDs" });
  }
}
