import { Agent, AgentContext, AgentMessage } from "../core/types.js";

/** Extracts address-like filters and requests ZPID lookup. */
export class ZpidFinderAgent implements Agent {
  role: "zpid-finder" = "zpid-finder";

  /** Parse goal (if needed) and call properties.lookup with inferred filters. */
  async think(ctx: AgentContext): Promise<AgentMessage> {
    if (ctx.blackboard.plan?.inFlightStepKey) {
      return { from: this.role, content: "Coordinator in-flight; waiting." };
    }
    if ((ctx.blackboard.zpids || []).length) {
      return {
        from: this.role,
        content: "ZPIDs already available; skipping lookup.",
      };
    }

    if (!ctx.blackboard.parsed) {
      return {
        from: this.role,
        content: "Parsing goal for address and filters",
        data: { tool: { name: "util.parseGoal", args: { text: ctx.goal } } },
      };
    }

    const p = ctx.blackboard.parsed;
    const args: Record<string, unknown> = {};
    if (p?.city) args.city = p.city;
    if (p?.state) args.state = p.state;
    if (p?.zipcode) args.zipcode = p.zipcode;
    if (p?.beds != null) args.beds = p.beds;
    if (p?.baths != null) args.baths = p.baths;
    // If the user gave a street address in the goal, util.parseGoal may not capture it; fallback to quick regex
    const address = (ctx.goal.match(/\b\d+\s+[A-Za-z][\w\s]+\b/) || [])[0];
    if (address) args.address = address;

    if (!Object.keys(args).length) {
      return {
        from: this.role,
        content: "No address-like details found; skipping.",
      };
    }
    return {
      from: this.role,
      content: "Looking up ZPIDs from parsed goal",
      data: { tool: { name: "properties.lookup", args } },
    };
  }
}
