import { Agent, AgentContext, AgentMessage } from "../core/types.js";

/** Runs analytics steps: summaries and ZIP grouping. */
export class AnalyticsAnalystAgent implements Agent {
  role: "analytics-analyst" = "analytics-analyst";

  /** Prefer summary first; then groups, skipping if already present. */
  async think(ctx: AgentContext): Promise<AgentMessage> {
    if (ctx.blackboard.plan?.inFlightStepKey) {
      return { from: this.role, content: "Coordinator in-flight; waiting." };
    }
    // If summarize not available, run it; else group by zip if not present
    if (!ctx.blackboard.analytics?.summary) {
      const q = ctx.goal.replace(/\s+/g, " ").trim();
      if (!q)
        return {
          from: this.role,
          content: "No query for analytics; skipping.",
        };
      return {
        from: this.role,
        content: "Summarizing search",
        data: {
          tool: { name: "analytics.summarizeSearch", args: { q, topK: 200 } },
        },
      };
    }
    if (!ctx.blackboard.analytics?.groups) {
      const q = ctx.goal.replace(/\s+/g, " ").trim();
      return {
        from: this.role,
        content: "Grouping by ZIP",
        data: {
          tool: { name: "analytics.groupByZip", args: { q, topK: 200 } },
        },
      };
    }
    return { from: this.role, content: "Analytics complete." };
  }
}
