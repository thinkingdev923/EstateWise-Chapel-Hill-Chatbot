import { Agent, AgentContext, AgentMessage } from "../core/types.js";

/** Dedupe and cap ZPID list, preserving insertion order. */
export class DedupeRankingAgent implements Agent {
  role: "ranker-analyst" = "ranker-analyst";

  /** Compute a rankedZpids list and mirror zpids for downstream tools. */
  async think(ctx: AgentContext): Promise<AgentMessage> {
    // Only run if not blocked by coordinator, or if coordinator wants this step
    const step = ctx.blackboard.plan?.inFlightStepKey;
    if (step && step !== "dedupeRank") {
      return { from: this.role, content: "Waiting for coordinator steps." };
    }

    const list = ctx.blackboard.zpids || [];
    if (!list.length) return { from: this.role, content: "No ZPIDs to rank." };
    if (ctx.blackboard.rankedZpids?.length) {
      return { from: this.role, content: "Ranking already available." };
    }
    // Simple dedupe while preserving order
    const seen = new Set<number>();
    const ranked: number[] = [];
    for (const id of list) {
      if (!Number.isFinite(id)) continue;
      if (!seen.has(id)) {
        seen.add(id);
        ranked.push(id);
      }
    }
    // Cap to 100 for map/query sanity
    ctx.blackboard.rankedZpids = ranked.slice(0, 100);
    // Optionally update the main list so downstream uses ranked
    ctx.blackboard.zpids = ctx.blackboard.rankedZpids.slice();
    return {
      from: this.role,
      content: `Ranked ${ctx.blackboard.rankedZpids.length} unique ZPIDs (capped).`,
    };
  }
}
