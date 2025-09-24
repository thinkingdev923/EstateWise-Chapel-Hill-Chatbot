import { Agent, AgentContext, AgentMessage } from "../core/types.js";

/** Runs properties searches using parsed filters or goal keywords. */
export class PropertyAnalystAgent implements Agent {
  role: "property-analyst" = "property-analyst";

  /** Prefer properties.searchAdvanced when parsed filters exist. */
  async think(ctx: AgentContext): Promise<AgentMessage> {
    if (ctx.blackboard.plan?.inFlightStepKey) {
      return { from: this.role, content: "Coordinator in-flight; waiting." };
    }
    // Prefer structured filters from blackboard
    if (ctx.blackboard.parsed) {
      const p = ctx.blackboard.parsed;
      const adv: Record<string, unknown> = {};
      if (p?.city) adv.city = p.city;
      if (p?.state && p?.city) adv.city = `${p.city}, ${p.state}`; // keep consistent with query style
      if (p?.zipcode) adv.zipcode = p.zipcode;
      if (p?.beds != null) adv.beds = p.beds;
      if (p?.baths != null) adv.baths = p.baths;
      if (Object.keys(adv).length) {
        return {
          from: this.role,
          content: "Running advanced property search from parsed filters",
          data: {
            tool: {
              name: "properties.searchAdvanced",
              args: { ...adv, topK: 100 },
            },
          },
        };
      }
    }
    // Use previous planner step for broad property search if not yet executed
    const last = ctx.history[ctx.history.length - 1];
    if (last?.data && (last.data as any).tool?.name === "properties.search") {
      return {
        from: this.role,
        content: "Proceed with properties.search",
        data: last.data,
      };
    }
    // Otherwise attempt a refined query based on goal keywords
    const keywords = ctx.goal.replace(/[^\w\s]/g, " ").trim();
    return {
      from: this.role,
      content: "Refined property search from goal keywords",
      data: {
        tool: { name: "properties.search", args: { q: keywords, topK: 100 } },
      },
    };
  }
}
