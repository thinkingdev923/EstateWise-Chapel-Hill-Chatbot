import { Agent, AgentContext, AgentMessage } from "../core/types.js";

/** Uses the graph: similars or path explanations when ZPIDs are present. */
export class GraphAnalystAgent implements Agent {
  role: "graph-analyst" = "graph-analyst";

  /** Prefer graph.explain when at least two ZPIDs; else graph.similar for one. */
  async think(ctx: AgentContext): Promise<AgentMessage> {
    if (ctx.blackboard.plan?.inFlightStepKey) {
      return { from: this.role, content: "Coordinator in-flight; waiting." };
    }
    // Prefer blackboard ZPIDs collected from prior tools; fallback to history scraping.
    let zpids = ctx.blackboard.zpids || [];
    if (!zpids.length) {
      const text = ctx.history.map((m) => m.content).join("\n");
      const zpidMatches = [
        ...text.matchAll(/(\d{5,})_zpid|\b(zpid[:#]?\s*)(\d{5,})/gi),
      ];
      zpids = Array.from(
        new Set(
          zpidMatches
            .map((m) => Number(m[3] || m[1]?.replace("_zpid", "") || "0"))
            .filter(Boolean),
        ),
      );
    }

    if (zpids.length >= 2) {
      const [from, to] = zpids.slice(0, 2);
      return {
        from: this.role,
        content: "Requesting graph explanation between zpids",
        data: { tool: { name: "graph.explain", args: { from, to } } },
      };
    }
    if (zpids.length === 1) {
      return {
        from: this.role,
        content: "Requesting graph-based similars",
        data: {
          tool: { name: "graph.similar", args: { zpid: zpids[0], limit: 10 } },
        },
      };
    }

    // If the plan includes a neighborhood, run stats
    const text = ctx.history.map((m) => m.content).join("\n");
    const hoodMatch = text.match(/neighborhood\s*:\s*([\w\s-]+)/i);
    if (hoodMatch) {
      return {
        from: this.role,
        content: "Requesting neighborhood stats",
        data: {
          tool: {
            name: "graph.neighborhood",
            args: { name: hoodMatch[1].trim(), limit: 50 },
          },
        },
      };
    }

    return { from: this.role, content: "No graph action found; deferring." };
  }
}
