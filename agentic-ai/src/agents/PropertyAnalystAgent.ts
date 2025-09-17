import { Agent, AgentContext, AgentMessage } from "../core/types.js";

export class PropertyAnalystAgent implements Agent {
  role: "property-analyst" = "property-analyst";

  async think(ctx: AgentContext): Promise<AgentMessage> {
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
