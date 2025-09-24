import { Agent, AgentContext, AgentMessage } from "../core/types.js";

/** Performs sanity checks over analytics, finance, and ZPID counts. */
export class ComplianceAgent implements Agent {
  role: "compliance-analyst" = "compliance-analyst";

  /** Produce a compact compliance summary and update blackboard. */
  async think(ctx: AgentContext): Promise<AgentMessage> {
    // Only run if not blocked by coordinator, or if coordinator wants this step
    const step = ctx.blackboard.plan?.inFlightStepKey;
    if (step && step !== "compliance") {
      return { from: this.role, content: "Waiting for coordinator steps." };
    }

    const issues: string[] = [];
    // Check analytics medians
    const s = (ctx.blackboard.analytics?.summary || {}) as any;
    if (s) {
      if (s.medianPrice != null && s.medianPrice < 0)
        issues.push("Median price negative.");
      if (s.medianSqft != null && s.medianSqft <= 0)
        issues.push("Median sqft not positive.");
      if (s.medianPricePerSqft != null && s.medianPricePerSqft <= 0)
        issues.push("Median $/sqft not positive.");
    }
    // Check finance calculations
    const m = (ctx.blackboard.mortgage || {}) as any;
    if (m) {
      if (m.apr != null && (m.apr < 0 || m.apr > 20))
        issues.push("APR unusually out of range (0-20%).");
      if (m.total != null && m.total < 0)
        issues.push("Monthly payment negative.");
    }
    // Basic sanity: zpids count
    const count = (ctx.blackboard.zpids || []).length;
    if (count > 200)
      issues.push("Too many ZPIDs collected; consider narrowing filters.");

    const ok = issues.length === 0;
    ctx.blackboard.compliance = { ok, issues };
    const summary = ok
      ? "Compliance checks passed."
      : `Compliance issues: ${issues.join(" | ")}`;
    return { from: this.role, content: summary };
  }
}
