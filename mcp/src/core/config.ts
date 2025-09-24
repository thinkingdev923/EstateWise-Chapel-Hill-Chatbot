const toInt = (v: string | undefined, d: number) => {
  const n = v ? parseInt(v, 10) : NaN;
  return Number.isFinite(n) ? n : d;
};

const toBool = (v: string | undefined, d: boolean) => {
  if (v == null) return d;
  const s = v.toLowerCase();
  return s === "1" || s === "true" || s === "yes" || s === "on";
};

/**
 * MCP server configuration resolved from environment variables with defaults.
 */
export const config = {
  apiBaseUrl:
    process.env.API_BASE_URL || "https://estatewise-backend.vercel.app",
  frontendBaseUrl:
    process.env.FRONTEND_BASE_URL || "https://estatewise.vercel.app",
  cacheTtlMs: toInt(process.env.MCP_CACHE_TTL_MS, 30_000),
  cacheMax: toInt(process.env.MCP_CACHE_MAX, 200),
  debug: toBool(process.env.MCP_DEBUG, false),
};
