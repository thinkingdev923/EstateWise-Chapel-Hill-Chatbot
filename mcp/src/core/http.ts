import { config } from "./config.js";
import { LruCache } from "./cache.js";
import { debug } from "./logger.js";

type Headers = Record<string, string>;

function buildUrl(base: string, path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const baseTrim = base.replace(/\/$/, "");
  const pathTrim = path.startsWith("/") ? path : `/${path}`;
  return `${baseTrim}${pathTrim}`;
}

/**
 * Build a leading `?` querystring from a params record.
 * Skips null/undefined values and coerces others to strings.
 */
export function qs(params: Record<string, unknown> = {}): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue;
    sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

async function handleJsonResponse(res: Response) {
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const j = await res.json();
      if ((j as any)?.error) msg += `: ${(j as any).error}`;
    } catch {
      // ignore
    }
    throw new Error(msg);
  }
  return res.json();
}

/** Perform a GET request to the backend API. */
export async function httpGet(
  path: string,
  opts: { headers?: Headers; baseUrl?: string } = {},
) {
  const url = buildUrl(opts.baseUrl || config.apiBaseUrl, path);
  const res = await fetch(url, { headers: opts.headers });
  return handleJsonResponse(res as unknown as Response);
}

const responseCache = new LruCache<string, any>(
  config.cacheMax,
  config.cacheTtlMs,
);

/** Perform a GET request with in-memory LRU+TTL caching. */
export async function httpGetCached(
  path: string,
  opts: { headers?: Headers; baseUrl?: string } = {},
) {
  const url = buildUrl(opts.baseUrl || config.apiBaseUrl, path);
  const cached = responseCache.get(url);
  if (cached !== undefined) {
    debug("cache hit", url);
    return cached;
  }
  debug("cache miss", url);
  const res = await fetch(url, { headers: opts.headers });
  const json = await handleJsonResponse(res as unknown as Response);
  responseCache.set(url, json);
  return json;
}

/** Clear all entries from the HTTP GET cache. */
export function httpCacheClear() {
  responseCache.clear();
}

/** Perform a POST request to the backend API. */
export async function httpPost(
  path: string,
  body: unknown,
  opts: { headers?: Headers; baseUrl?: string } = {},
) {
  const url = buildUrl(opts.baseUrl || config.apiBaseUrl, path);
  const headers: Headers = {
    "Content-Type": "application/json",
    ...(opts.headers || {}),
  };
  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  return handleJsonResponse(res as unknown as Response);
}

/** Perform a PUT request to the backend API. */
export async function httpPut(
  path: string,
  body: unknown,
  opts: { headers?: Headers; baseUrl?: string } = {},
) {
  const url = buildUrl(opts.baseUrl || config.apiBaseUrl, path);
  const headers: Headers = {
    "Content-Type": "application/json",
    ...(opts.headers || {}),
  };
  const res = await fetch(url, {
    method: "PUT",
    headers,
    body: JSON.stringify(body),
  });
  return handleJsonResponse(res as unknown as Response);
}

/** Perform a DELETE request to the backend API. */
export async function httpDelete(
  path: string,
  opts: { headers?: Headers; baseUrl?: string } = {},
) {
  const url = buildUrl(opts.baseUrl || config.apiBaseUrl, path);
  const res = await fetch(url, { method: "DELETE", headers: opts.headers });
  return handleJsonResponse(res as unknown as Response);
}

/** Convenience helper to return a Bearer auth header. */
export function bearer(token: string): Headers {
  return { Authorization: `Bearer ${token}` };
}
