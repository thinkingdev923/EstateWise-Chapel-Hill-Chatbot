import { Agent, AgentContext, AgentMessage } from "../core/types.js";

/** Requests mortgage breakdown using signals from goal or analytics. */
export class FinanceAnalystAgent implements Agent {
  role: "finance-analyst" = "finance-analyst" as const;

  /** Build a finance.mortgage request based on detected APR/price/years. */
  async think(ctx: AgentContext): Promise<AgentMessage> {
    if (ctx.blackboard.plan?.inFlightStepKey) {
      return { from: this.role, content: "Coordinator in-flight; waiting." };
    }
    // Prefer price signal from blackboard analytics; else parse goal; else fallback
    const boardPrice = (ctx.blackboard.analytics?.summary as any)
      ?.medianPrice as number | undefined;
    const mPrice = ctx.goal.match(/\$?(\d{3,}[,\d]*)/);
    const price =
      boardPrice ?? (mPrice ? Number(mPrice[1].replace(/,/g, "")) : 600000);
    const mRate = ctx.goal.match(/(\d+(?:\.\d+)?)%/);
    const apr = mRate ? Number(mRate[1]) : 6.5;
    const years = /\b(15|30)\b/.test(ctx.goal) ? Number(RegExp.$1) : 30;

    return {
      from: this.role,
      content: "Requesting mortgage breakdown",
      data: {
        tool: {
          name: "finance.mortgage",
          args: {
            price,
            apr,
            years,
            downPct: 20,
            taxRatePct: 1.0,
            insMonthly: 120,
            hoaMonthly: 0,
          },
        },
      },
    };
  }
}
