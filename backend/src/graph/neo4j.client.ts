import neo4j, { Driver, Session } from "neo4j-driver";

let driver: Driver | null = null;

function required(name: string, value: string | undefined): string {
  if (!value || !value.trim()) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value.trim();
}

export function isNeo4jEnabled(): boolean {
  return process.env.NEO4J_ENABLE === "true" || !!process.env.NEO4J_URI;
}

export function getDriver(): Driver {
  if (driver) return driver;
  const uri = required("NEO4J_URI", process.env.NEO4J_URI);
  const username = required("NEO4J_USERNAME", process.env.NEO4J_USERNAME);
  const password = required("NEO4J_PASSWORD", process.env.NEO4J_PASSWORD);

  driver = neo4j.driver(uri, neo4j.auth.basic(username, password));
  return driver;
}

export function getSession(mode: "READ" | "WRITE" = "READ"): Session {
  const db = process.env.NEO4J_DATABASE || "neo4j";
  const accessMode = mode === "READ" ? neo4j.session.READ : neo4j.session.WRITE;
  return getDriver().session({ database: db, defaultAccessMode: accessMode });
}

export async function runRead<T = any>(
  cypher: string,
  params: Record<string, any> = {},
): Promise<T[]> {
  const session = getSession("READ");
  try {
    const res = await session.run(cypher, params);
    return res.records.map((r) => r.toObject() as T);
  } finally {
    await session.close();
  }
}

export async function runWrite<T = any>(
  cypher: string,
  params: Record<string, any> = {},
): Promise<T[]> {
  const session = getSession("WRITE");
  try {
    const res = await session.run(cypher, params);
    return res.records.map((r) => r.toObject() as T);
  } finally {
    await session.close();
  }
}

export async function pingNeo4j(): Promise<boolean> {
  if (!isNeo4jEnabled()) return false;
  try {
    const res = await runRead("RETURN 1 AS ok");
    return !!res.length;
  } catch {
    return false;
  }
}

export async function closeNeo4j(): Promise<void> {
  if (driver) {
    await driver.close();
    driver = null;
  }
}
