/*
  Ingest Property records from Pinecone into Neo4j with basic topology:
  (Property)-[:IN_ZIP]->(Zip) and (Property)-[:IN_NEIGHBORHOOD]->(Neighborhood)

  Usage (env required):
  - PINECONE_API_KEY
  - PINECONE_INDEX
  - NEO4J_URI
  - NEO4J_USERNAME
  - NEO4J_PASSWORD
  - NEO4J_DATABASE (optional, defaults to 'neo4j')
  - PINECONE_NAMESPACE (optional, defaults to '')
  - INGEST_LIMIT (optional, default 1000)
*/
import dotenv from "dotenv";
import { index as pineconeIndex } from "../pineconeClient";
import { getDriver, runWrite, closeNeo4j } from "../graph/neo4j.client";
import fs from "fs";
import path from "path";

dotenv.config();

async function main() {
  // Pinecone client is initialized in pineconeClient.ts and will throw if env is missing.
  console.log("Using Pinecone as source");

  // Init Neo4j driver (throws if env missing)
  getDriver();
  console.log("Initialized Neo4j driver");

  // Optional destructive reset
  const resetMode = (process.env.NEO4J_RESET || "").toLowerCase();
  if (resetMode) {
    console.warn(
      `NEO4J_RESET='${resetMode}' enabled. Clearing existing graph...`,
    );
    if (resetMode === "all") {
      await runWrite(`MATCH (n) DETACH DELETE n`);
    } else {
      await runWrite(`MATCH (p:Property) DETACH DELETE p`);
      await runWrite(`MATCH (z:Zip) DETACH DELETE z`);
      await runWrite(`MATCH (h:Neighborhood) DETACH DELETE h`);
    }
  }

  // Ensure constraints / indexes (one statement per query)
  await runWrite(
    `CREATE CONSTRAINT IF NOT EXISTS FOR (p:Property) REQUIRE p.zpid IS UNIQUE`,
  );
  await runWrite(`CREATE INDEX IF NOT EXISTS FOR (z:Zip) ON (z.code)`);
  await runWrite(`CREATE INDEX IF NOT EXISTS FOR (n:Neighborhood) ON (n.name)`);

  // Retry helper for transient Neo4j failures
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
  const maxRetries = Number(process.env.NEO4J_WRITE_RETRIES || 5);
  async function runWriteWithRetry<T = any>(
    cypher: string,
    params: Record<string, any>,
  ) {
    let attempt = 0;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      try {
        return await runWrite<T>(cypher, params);
      } catch (err: any) {
        attempt++;
        const code = err?.code || "";
        const retriable = err?.retriable === true || code === "SessionExpired";
        if (attempt > maxRetries || !retriable) throw err;
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        console.warn(
          `Neo4j write failed (attempt ${attempt}/${maxRetries}). Retrying in ${delay}ms...`,
        );
        await closeNeo4j().catch(() => {});
        await sleep(delay);
        getDriver();
      }
    }
  }
  // Determine ingest limit: default to ALL if not set.
  const rawLimit = (process.env.INGEST_LIMIT || "").trim();
  let limit =
    rawLimit === "" || rawLimit.toLowerCase() === "all" || rawLimit === "0"
      ? Number.POSITIVE_INFINITY
      : Number(rawLimit);
  if (!Number.isFinite(limit) || limit < 0) {
    limit = Number.POSITIVE_INFINITY;
  }
  const namespace = process.env.PINECONE_NAMESPACE || "";
  console.log(
    `Starting Pinecone -> Neo4j ingest. Namespace='${namespace || ""}', Limit=${limit === Number.POSITIVE_INFINITY ? "ALL" : limit}`,
  );
  const nsIndex = namespace
    ? pineconeIndex.namespace(namespace)
    : pineconeIndex;

  // Checkpoint file support for resume
  const checkpointPath =
    process.env.INGEST_CHECKPOINT_FILE ||
    path.join(process.cwd(), ".neo4j_ingest_checkpoint.json");
  function saveCheckpoint(nextToken: string | undefined, processed: number) {
    try {
      const data = {
        namespace,
        nextToken: nextToken || null,
        processed,
        pageSize: PAGE_SIZE,
        ts: new Date().toISOString(),
      };
      fs.writeFileSync(checkpointPath, JSON.stringify(data, null, 2), {
        encoding: "utf8",
      });
    } catch {}
  }
  function loadCheckpoint(): {
    nextToken?: string;
    processed?: number;
    pageSize?: number;
  } | null {
    try {
      if (!fs.existsSync(checkpointPath)) return null;
      const raw = JSON.parse(fs.readFileSync(checkpointPath, "utf8"));
      if (raw && raw.namespace === namespace) {
        return {
          nextToken: raw.nextToken || undefined,
          processed: Number(raw.processed || 0),
          pageSize: Number(raw.pageSize || PAGE_SIZE),
        };
      }
      return null;
    } catch {
      return null;
    }
  }

  let count = 0;
  let paginationToken: string | undefined = undefined;
  const startTokenEnv =
    (process.env.PINECONE_START_TOKEN || "").trim() || undefined;
  const doResume = (process.env.INGEST_RESUME || "").toLowerCase() === "true";
  const checkpoint = doResume ? loadCheckpoint() : null;
  if (startTokenEnv) {
    paginationToken = startTokenEnv;
    console.log(`Starting from provided START_TOKEN`);
  } else if (doResume) {
    if (checkpoint && checkpoint.nextToken) {
      paginationToken = checkpoint.nextToken;
      console.log(`Resuming from checkpoint token`);
    }
  }
  const PAGE_SIZE = Math.max(
    1,
    Math.min(1000, Number(process.env.PINECONE_PAGE_SIZE || 100)),
  );

  async function listPageOrSkip(token: string | undefined, pageLimit: number) {
    try {
      return await nsIndex.listPaginated({
        limit: pageLimit,
        paginationToken: token,
      });
    } catch (err) {
      // If token invalid and we have checkpoint, attempt skip-by-count fallback
      if (doResume && checkpoint && checkpoint.processed) {
        console.warn(
          `listPaginated failed (token may be invalid). Attempting skip-by-count fallback...`,
        );
        let tempToken: string | undefined = undefined;
        // compute pages to skip based on processed count and page size
        const ps =
          checkpoint.pageSize && checkpoint.pageSize > 0
            ? checkpoint.pageSize
            : PAGE_SIZE;
        const pagesToSkip = Math.floor((checkpoint.processed || 0) / ps);
        let resp = await nsIndex.listPaginated({
          limit: ps,
          paginationToken: undefined,
        });
        tempToken = resp.pagination?.next || undefined;
        for (let i = 1; i < pagesToSkip && tempToken; i++) {
          resp = await nsIndex.listPaginated({
            limit: ps,
            paginationToken: tempToken,
          });
          tempToken = resp.pagination?.next || undefined;
        }
        return await nsIndex.listPaginated({
          limit: pageLimit,
          paginationToken: tempToken,
        });
      }
      throw err;
    }
  }

  while (count < limit) {
    const remaining = limit - count;
    const pageLimit = Math.min(
      PAGE_SIZE,
      Number.isFinite(remaining) ? remaining : PAGE_SIZE,
    );
    const listResp = await listPageOrSkip(paginationToken, pageLimit);
    console.log(
      `Fetched ID page: ${listResp.vectors?.length || 0} ids; nextToken=${listResp.pagination?.next ? "yes" : "no"}`,
    );
    const ids = (listResp.vectors || [])
      .map((v: any) => v?.id)
      .filter(
        (id: any): id is string => typeof id === "string" && id.length > 0,
      );

    if (ids.length === 0) {
      break; // nothing to ingest
    }

    // Fetch metadata for this page of ids
    const fetchResp = await nsIndex.fetch(ids);

    for (const id of ids) {
      const rec = fetchResp.records[id];
      if (!rec || !rec.metadata) continue;
      const m = rec.metadata as Record<string, any>;

      let addr: any = null;
      if (typeof m.address === "string") {
        try {
          addr = JSON.parse(m.address);
        } catch {
          addr = null;
        }
      }

      const zpid = Number(m.zpid ?? id);
      if (!Number.isFinite(zpid)) continue;

      const zipcode = addr?.zipcode ?? null;
      const neighborhood = addr?.neighborhood ?? null;

      const num = (v: any): number | null => {
        const n = Number(v);
        return Number.isFinite(n) ? n : null;
      };

      const props = {
        zpid,
        streetAddress: addr?.streetAddress ?? null,
        city: (typeof m.city === "string" ? m.city : addr?.city) ?? null,
        state: (typeof m.state === "string" ? m.state : addr?.state) ?? null,
        zipcode,
        price: num(m.price),
        bedrooms: num(m.bedrooms),
        bathrooms: num(m.bathrooms),
        livingArea: num(m.livingArea),
        yearBuilt: num(m.yearBuilt),
        homeType: typeof m.homeType === "string" ? m.homeType : null,
        description: typeof m.description === "string" ? m.description : null,
        latitude: num(m.latitude),
        longitude: num(m.longitude),
      };

      await runWriteWithRetry(
        `
        MERGE (prop:Property {zpid: $zpid})
        SET prop += $props
        WITH prop
        CALL {
          WITH prop
          WITH prop WHERE $zipcode IS NOT NULL
          MERGE (z:Zip {code: $zipcode})
          MERGE (prop)-[:IN_ZIP]->(z)
          RETURN 1 AS zip_done
        }
        WITH prop
        CALL {
          WITH prop
          WITH prop WHERE $neighborhood IS NOT NULL AND $neighborhood <> ''
          MERGE (n:Neighborhood {name: $neighborhood})
          MERGE (prop)-[:IN_NEIGHBORHOOD]->(n)
          RETURN 1 AS hood_done
        }
        RETURN prop
        `,
        { zpid, props, zipcode, neighborhood },
      );

      count++;
      if (count % 100 === 0) console.log(`Upserted ${count} properties...`);
      if (count >= limit) break;
    }

    // Continue to next page if available; save checkpoint after successful page
    paginationToken = listResp.pagination?.next || undefined;
    saveCheckpoint(paginationToken, count);
    if (!paginationToken) break; // no more pages
  }

  console.log(`Done. Upserted ${count} properties into Neo4j from Pinecone.`);
}

main()
  .catch((err) => {
    console.error("Neo4j ingestion failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeNeo4j().catch(() => {});
    // Ensure process terminates even when launched via ts-node-dev
    process.exit(process.exitCode ?? 0);
  });
