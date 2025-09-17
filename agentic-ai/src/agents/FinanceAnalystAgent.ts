import { Agent, AgentContext, AgentMessage } from '../core/types.js';

export class FinanceAnalystAgent implements Agent {
  role: 'finance-analyst' = 'finance-analyst' as const;

  async think(ctx: AgentContext): Promise<AgentMessage> {
    // Heuristic defaults from goal text; could parse with regex for numbers
    const mPrice = ctx.goal.match(/\$?(\d{3,}[,\d]*)/);
    const price = mPrice ? Number(mPrice[1].replace(/,/g, '')) : 600000;
    const mRate = ctx.goal.match(/(\d+(?:\.\d+)?)%/);
    const apr = mRate ? Number(mRate[1]) : 6.5;
    const years = /\b(15|30)\b/.test(ctx.goal) ? Number(RegExp.$1) : 30;

    return {
      from: this.role,
      content: 'Requesting mortgage breakdown',
      data: {
        tool: {
          name: 'finance.mortgage',
          args: { price, apr, years, downPct: 20, taxRatePct: 1.0, insMonthly: 120, hoaMonthly: 0 },
        },
      },
    };
  }
}

