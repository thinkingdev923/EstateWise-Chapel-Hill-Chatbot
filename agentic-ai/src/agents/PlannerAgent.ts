import {
  Agent,
  AgentContext,
  AgentMessage,
  Plan,
  PlanStep,
} from "../core/types.js";

/** Drafts an initial coarse plan from the user goal. */
export class PlannerAgent implements Agent {
  role: "planner" = "planner";

  /** Build a simple linear plan the coordinator and others can refine. */
  async think(ctx: AgentContext): Promise<AgentMessage> {
    const goal = ctx.goal.trim();
    const steps: PlanStep[] = [
      {
        description: "Find core properties and charts matching the request",
        tool: { name: "properties.search", args: { q: goal, topK: 100 } },
      },
      {
        description: "If two zpids present, explain relationship in graph",
        // downstream agents may fill in zpids
      },
      {
        description: "Summarize market and build map link",
        tool: { name: "map.linkForZpids", args: { ids: [] } },
      },
    ];
    const plan: Plan = { goal, steps };
    return {
      from: this.role,
      to: "all",
      content: "Initial plan drafted",
      data: plan,
    };
  }
}
