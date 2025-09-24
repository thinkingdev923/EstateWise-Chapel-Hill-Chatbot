import { config } from "./config.js";

/** Log debug messages when MCP_DEBUG=true. */
export function debug(...args: any[]) {
  if (config.debug) {
    // eslint-disable-next-line no-console
    console.log("[MCP]", ...args);
  }
}
