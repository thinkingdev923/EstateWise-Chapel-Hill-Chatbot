import { runRead } from "./neo4j.client";

export interface GraphProperty {
  zpid: number;
  streetAddress?: string;
  city?: string;
  state?: string;
  zipcode?: string;
  price?: number;
  bedrooms?: number;
  bathrooms?: number;
  livingArea?: number;
  yearBuilt?: number;
  homeType?: string;
  description?: string;
}

export interface SimilarWithReason {
  property: GraphProperty;
  score: number;
  reasons: string[];
}

export async function getSimilarByZpid(
  zpid: number,
  limit = 10,
): Promise<SimilarWithReason[]> {
  const rows = await runRead(
    `
    MATCH (p:Property {zpid: $zpid})
    // Collect neighborhood and zip co-membership candidates
    OPTIONAL MATCH (p)-[:IN_NEIGHBORHOOD]->(:Neighborhood)<-[:IN_NEIGHBORHOOD]-(nCand:Property)
    OPTIONAL MATCH (p)-[:IN_ZIP]->(:Zip)<-[:IN_ZIP]-(zCand:Property)
    WITH p, collect(DISTINCT nCand) + collect(DISTINCT zCand) AS cands
    UNWIND cands AS c
    WITH p, c WHERE c IS NOT NULL AND c.zpid <> p.zpid
    WITH p, c,
      abs(coalesce(c.price,0) - coalesce(p.price,0)) / (CASE WHEN coalesce(p.price,0)=0 THEN 1 ELSE p.price END) AS priceDiff,
      abs(coalesce(c.livingArea,0) - coalesce(p.livingArea,0)) / (CASE WHEN coalesce(p.livingArea,0)=0 THEN 1 ELSE p.livingArea END) AS areaDiff,
      abs(coalesce(c.bedrooms,0) - coalesce(p.bedrooms,0)) AS bedDiff,
      abs(coalesce(c.bathrooms,0) - coalesce(p.bathrooms,0)) AS bathDiff,
      EXISTS( (p)-[:IN_NEIGHBORHOOD]->(:Neighborhood)<-[:IN_NEIGHBORHOOD]-(c) ) AS sameNeighborhood,
      EXISTS( (p)-[:IN_ZIP]->(:Zip)<-[:IN_ZIP]-(c) ) AS sameZip,
      EXISTS( (p)-[:SIMILAR_TO]-(c) ) AS hasSimilarEdge
    WITH p, c,
      (priceDiff*0.5 + areaDiff*0.3 + bedDiff*0.1 + bathDiff*0.1) AS score,
      sameNeighborhood, sameZip, hasSimilarEdge
    RETURN c { .* } AS property, score, sameNeighborhood, sameZip, hasSimilarEdge
    ORDER BY score ASC
    LIMIT toInteger($limit)
    `,
    { zpid, limit },
  );

  return rows.map((r: any) => {
    const reasons: string[] = [];
    if (r.sameNeighborhood) reasons.push("same neighborhood");
    if (r.sameZip) reasons.push("same zip code");
    if (r.hasSimilarEdge) reasons.push("vector similarity");
    return {
      property: r.property as GraphProperty,
      score: typeof r.score === "number" ? r.score : Number(r.score ?? 0),
      reasons,
    };
  });
}

export async function explainPath(
  fromZpid: number,
  toZpid: number,
): Promise<{ nodes: GraphProperty[]; rels: { type: string }[] } | null> {
  const rows = await runRead(
    `
    MATCH p=allShortestPaths( (a:Property {zpid:$from})-[:IN_ZIP|IN_NEIGHBORHOOD|SIMILAR_TO*1..3]-(b:Property {zpid:$to}) )
    RETURN p
    LIMIT 1
    `,
    { from: fromZpid, to: toZpid },
  );
  if (!rows.length) return null;
  const record = rows[0] as any;
  const path = record.p;
  const nodes: GraphProperty[] = path.segments
    ? [path.start, ...path.segments.map((s: any) => s.end)].map(
        (n: any) => n.properties,
      )
    : [];
  const rels = path.segments
    ? path.segments.map((s: any) => ({ type: s.relationship.type }))
    : [];
  return { nodes, rels };
}

export async function getNeighborhoodStats(
  name: string,
  limit = 50,
): Promise<{
  count: number;
  avgPrice: number | null;
  avgArea: number | null;
  properties: GraphProperty[];
}> {
  const rows = await runRead(
    `
    MATCH (n:Neighborhood {name:$name})<-[:IN_NEIGHBORHOOD]-(p:Property)
    RETURN count(p) AS count, avg(p.price) AS avgPrice, avg(p.livingArea) AS avgArea, collect(p{.*})[0..toInteger($limit)] AS properties
    `,
    { name, limit },
  );
  if (!rows.length)
    return { count: 0, avgPrice: null, avgArea: null, properties: [] };
  const r = rows[0] as any;
  return {
    count: Number(r.count ?? 0),
    avgPrice: r.avgPrice != null ? Number(r.avgPrice) : null,
    avgArea: r.avgArea != null ? Number(r.avgArea) : null,
    properties: (r.properties || []) as GraphProperty[],
  };
}
