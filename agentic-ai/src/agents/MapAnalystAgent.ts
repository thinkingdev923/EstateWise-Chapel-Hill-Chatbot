import { Agent, AgentContext, AgentMessage } from "../core/types.js";

/** Builds a map deep link from known ZPIDs or a query. */
export class MapAnalystAgent implements Agent {
  role: "map-analyst" = "map-analyst";

  /** Prefer map.linkForZpids using blackboard ZPIDs; else buildLinkByQuery. */
  async think(ctx: AgentContext): Promise<AgentMessage> {
    if (ctx.blackboard.plan?.inFlightStepKey) {
      return { from: this.role, content: "Coordinator in-flight; waiting." };
    }
    // Prefer blackboard ZPIDs
    const ids = (ctx.blackboard.zpids || []).map(String).slice(0, 50);
    // Fallback: scrape history if blackboard empty
    if (!ids.length) {
      const text = ctx.history.map((m) => m.content).join("\n");
      const match = [...text.matchAll(/\b(\d{5,})\b/g)].map((m) => m[1]);
      for (const id of match) if (!ids.includes(id)) ids.push(id);
    }
    if (ids.length) {
      return {
        from: this.role,
        content: "Building map link for mentioned ZPIDs",
        data: { tool: { name: "map.linkForZpids", args: { ids } } },
      };
    }
    // Fallback: build query-based map link
    return {
      from: this.role,
      content: "Building map link from goal query",
      data: { tool: { name: "map.buildLinkByQuery", args: { q: ctx.goal } } },
    };
  }
}
